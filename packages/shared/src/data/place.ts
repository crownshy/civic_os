/**
 * A Place: the geography a Campaign runs in, and the subdomain it is served
 * from. The public URL is heading for `<place>.bloomproject.us/<campaign-slug>`.
 *
 * A Place has no backend table, so it rides on `Conversation.metadata.place`.
 * ADR 0006 has the full reasoning and the way out; the short version is that
 * comhairle's Region model has no slug, no link to a Conversation, and no
 * anonymous read, and the participant app resolves the subdomain before anyone
 * has logged in.
 *
 * One Place per Campaign, and one poll behind it (ADR 0008). Many-to-many is the
 * agreed direction but nothing in comhairle supports it yet, so `place` is a
 * single object rather than a list.
 *
 * This module is the whole contract: `civicos` reads a Place through it to
 * decide what to serve, `admin` reads and writes one through it on Setup. It
 * lives in `shared` so those two cannot drift on the shape, which is the single
 * thing ADR 0006 promises. Everything that depends on `RegionConfig` or on the
 * request URL stays in the apps.
 */

export interface Place {
	/** URL-safe key. The subdomain this Campaign is served from. */
	slug: string;
	/** Display name, e.g. "Dundee, Scotland". */
	name: string;
}

/** Key this rides under inside the Conversation's `metadata` jsonb. */
export const PLACE_METADATA_KEY = 'place';

/** Longest a single DNS label may be, and so the longest a Place slug may be. */
const MAX_SLUG_LENGTH = 63;

/**
 * Read a Place out of a Conversation's metadata. `metadata` is untyped in the
 * generated client (`z.unknown()`) and hand-editable in the backend, so every
 * field is checked rather than asserted; anything malformed reads as absent and
 * the caller falls back.
 */
export function readPlace(metadata: unknown): Place | null {
	if (typeof metadata !== 'object' || metadata === null) return null;

	const value = (metadata as Record<string, unknown>)[PLACE_METADATA_KEY];
	if (typeof value !== 'object' || value === null) return null;

	const { slug, name } = value as Record<string, unknown>;
	if (typeof slug !== 'string' || slug.trim() === '') return null;
	if (typeof name !== 'string' || name.trim() === '') return null;

	return { slug: slug.trim(), name: name.trim() };
}

/**
 * The subdomain a Place name becomes. Hosts type a name, not a slug, so this is
 * the only thing standing between "Dundee, Scotland" and a DNS label.
 *
 * Accents are folded rather than dropped so "Córdoba" is `cordoba` and not
 * `c-rdoba`. The result is trimmed to a leading/trailing-hyphen-free label
 * within the 63-character limit, and is empty when the name carries nothing a
 * label can be built from (`"..."`, `"日本"`); callers treat empty as "this
 * name cannot be a Place" rather than writing a blank slug.
 */
export function toPlaceSlug(name: string): string {
	return name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, MAX_SLUG_LENGTH)
		.replace(/-+$/, '');
}

/** The Place a name would be stored as, or null when it cannot become one. */
export function placeFromName(name: string): Place | null {
	const trimmed = name.trim();
	const slug = toPlaceSlug(trimmed);

	return slug ? { slug, name: trimmed } : null;
}

/**
 * The comhairle Conversation slug for one Campaign in one Place.
 *
 * A Campaign runs in many Places and each pair is its own Conversation, so the
 * Conversations need distinct slugs while the Campaign keeps one name. The
 * Place is appended to make them distinct: `ai` in `utah` is `ai-utah`.
 *
 * The public URL does not show this. It stays `<place>.bloomproject.us/<ai>`;
 * the suffix is how that pair is looked up, which is what lets
 * `GET /conversation/:idOrSlug` resolve it with no campaign entity and no
 * metadata read. The subdomain is load bearing rather than decorative, which is
 * the state ADR 0007 wanted and could not reach.
 *
 * DERIVE FORWARD, NEVER PARSE BACK. `ai-central-oregon` is `ai` in
 * `central-oregon` or `ai-central` in `oregon`, and nothing in the string says
 * which. Code that needs the Campaign back out of a slug must match against the
 * known Place slugs (`campaignSlugFrom`), never split on a hyphen.
 */
export function conversationSlugFor(campaignSlug: string, placeSlug: string): string {
	const campaign = campaignSlug.trim();
	const place = placeSlug.trim();
	if (!campaign) return '';
	if (!place || campaign === place) return campaign;

	return `${campaign}-${place}`;
}

/**
 * The Campaign a Conversation slug belongs to, given the Places that exist.
 *
 * Longest matching Place wins, so `ai-central-oregon` resolves against
 * `central-oregon` rather than against an `oregon` that also exists. A slug
 * carrying no known Place suffix is its own Campaign, which is what every
 * single-Place Conversation looks like.
 */
export function campaignSlugFrom(conversationSlug: string, placeSlugs: string[]): string {
	const slug = conversationSlug.trim();
	const match = [...placeSlugs]
		.sort((a, b) => b.length - a.length)
		.find((place) => slug.endsWith(`-${place}`));

	return match ? slug.slice(0, -(match.length + 1)) : slug;
}

/**
 * Which Polis conversation a Campaign's poll is, mirrored onto the Conversation
 * metadata so the participant app can read it.
 *
 * The real source is the Polis workflow step's `toolConfig` (`poll_id`,
 * `server_url`), and that is **401 anonymously**: `GET /conversation/:id/workflow`
 * is public but `.../workflow_step` is not, so civicos cannot ask which poll it
 * is serving. `GET /conversation/:idOrSlug` is the only anonymous read there is,
 * and it returns `metadata`, so admin (which is authenticated and already
 * resolves the step) mirrors the identity there.
 *
 * This is a cache of an authenticated value into the public payload, not a
 * second source of truth. It is written whenever admin publishes a Campaign to
 * a Place, and it is the reason a Campaign created in admin can be served at
 * all: without it `polisId` only ever comes from the checked-in `regions.ts`
 * map, keyed by zip code.
 *
 * Retire it when comhairle exposes the poll id on the public Conversation
 * payload, or opens `workflow_step` for public conversations.
 */
export interface CampaignPoll {
	/** Polis conversation id, e.g. `2y2akzkmbb`. `toolConfig.poll_id`. */
	polisId: string;
	/** Polis server, when it differs from the app default. `toolConfig.server_url`. */
	polisUrl?: string;
	/** Invite record participants join through, when the Campaign has one. */
	inviteId?: string;
	/**
	 * The Key Question, i.e. the Polis step's `topic`. Mirrored for the same
	 * reason as the poll id: it lives on the step, and the step is 401.
	 */
	question?: string;
}

/** Key this rides under inside the Conversation's `metadata` jsonb. */
export const POLL_METADATA_KEY = 'poll';

/**
 * Read the poll identity out of a Conversation's metadata. Same contract as
 * `readPlace`: `metadata` is untyped and hand-editable, so a malformed value
 * reads as absent and the caller falls back to `regions.ts` rather than serving
 * a broken poll.
 */
export function readPoll(metadata: unknown): CampaignPoll | null {
	if (typeof metadata !== 'object' || metadata === null) return null;

	const value = (metadata as Record<string, unknown>)[POLL_METADATA_KEY];
	if (typeof value !== 'object' || value === null) return null;

	const { polisId, polisUrl, inviteId, question } = value as Record<string, unknown>;
	if (typeof polisId !== 'string' || polisId.trim() === '') return null;

	const poll: CampaignPoll = { polisId: polisId.trim() };
	if (typeof polisUrl === 'string' && polisUrl.trim() !== '') poll.polisUrl = polisUrl.trim();
	if (typeof inviteId === 'string' && inviteId.trim() !== '') poll.inviteId = inviteId.trim();
	if (typeof question === 'string' && question.trim() !== '') poll.question = question.trim();

	return poll;
}

/**
 * Where participants go for one Campaign.
 *
 * `<place>.<base>/<org>/conversations/<campaign-slug>`, mirroring comhairle's
 * own URLs. This is the single definition of that path; admin renders share
 * links from it and civicos routes to match, so a scheme change is a change
 * here and at the civicos route directory, and nowhere else.
 *
 * **The `<org>` segment is decorative.** civicos resolves a Campaign from the
 * slug alone and ignores it: an Organization has no URL-safe identifier (the DTO
 * carries `id` and a display `name`, nothing else), and `/organizations` is 401
 * to the anonymous participant app, so there is nothing to validate against.
 * Slugifying a display name is therefore the only option, and a Host rename
 * changes it. That is survivable precisely *because* it is ignored: a link
 * shared with a stale org name still resolves. Do not "fix" this into a checked
 * segment without an org slug on the backend, or every link already in the wild
 * breaks.
 *
 * **The Place subdomain is optional.** A Campaign has a participant site from
 * the moment it is created; publishing it to a Place gives it a nicer address,
 * it does not give it its first one. With no Place the site is the apex.
 */
export function participantUrl(
	placeSlug: string,
	campaignSlug: string,
	orgSlug: string,
	base: string,
	protocol = 'https'
): string {
	const apex = base
		.trim()
		.replace(/^https?:\/\//, '')
		.replace(/\/+$/, '');
	if (!apex || !campaignSlug.trim()) return '';

	// localhost has no TLS in dev, and a link that opens on the wrong scheme is
	// worse than one that opens plainly.
	const scheme = /^localhost([:/]|$)/.test(apex) || apex.endsWith('.localhost') ? 'http' : protocol;
	const place = placeSlug.trim();
	const host = place ? `${place}.${apex}` : apex;

	return `${scheme}://${host}${campaignPath(campaignSlug, orgSlug)}`;
}

/** Fallback `<org>` segment for a Campaign whose Host is not known. */
export const UNKNOWN_ORG_SLUG = 'host';

/**
 * The path part, `/<org>/conversations/<campaign-slug>`. Internal links build
 * from this rather than interpolating the shape by hand, so the route directory
 * and every link in the app move together.
 */
export function campaignPath(
	campaignSlug: string | undefined,
	orgSlug: string | undefined,
	...rest: string[]
): string {
	const campaign = (campaignSlug ?? '').trim();
	if (!campaign) return '';

	const org = toPlaceSlug(orgSlug ?? '') || UNKNOWN_ORG_SLUG;
	const tail = rest.filter((part) => part && part.trim() !== '').map((part) => `/${part.trim()}`);

	return `/${org}/conversations/${campaign}${tail.join('')}`;
}

/**
 * The Host a Campaign belongs to, mirrored onto the Conversation metadata.
 *
 * Same reason as the poll: the public payload carries `organizationId` and
 * nothing else, and `/organizations` is 401 anonymously, so the participant app
 * cannot turn that id into the `<org>` segment of its own URL. Admin resolves
 * the Host already and mirrors it on publish.
 *
 * Only the URL needs this. It is not an authority on who owns the Campaign;
 * `Conversation.organizationId` is.
 */
export interface CampaignOrg {
	/** URL segment, a slugified display name. Decorative, see `participantUrl`. */
	slug: string;
	name: string;
}

/** Key this rides under inside the Conversation's `metadata` jsonb. */
export const ORG_METADATA_KEY = 'org';

/** Read the Host out of a Conversation's metadata. Same contract as `readPlace`. */
export function readOrg(metadata: unknown): CampaignOrg | null {
	if (typeof metadata !== 'object' || metadata === null) return null;

	const value = (metadata as Record<string, unknown>)[ORG_METADATA_KEY];
	if (typeof value !== 'object' || value === null) return null;

	const { slug, name } = value as Record<string, unknown>;
	if (typeof name !== 'string' || name.trim() === '') return null;

	// The slug is derivable from the name, so a missing one is not fatal.
	const derived = typeof slug === 'string' && slug.trim() !== '' ? slug.trim() : toPlaceSlug(name);
	if (!derived) return null;

	return { slug: derived, name: name.trim() };
}
