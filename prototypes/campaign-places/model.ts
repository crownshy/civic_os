/**
 * PROTOTYPE — throwaway. See NOTES.md for the question this answers.
 *
 * The model under test:
 *
 *   Campaign <-> Place is many-to-many, and the join row IS the poll.
 *   One (campaign, place) pair = one comhairle Conversation with one Polis step,
 *   owned by whichever Host runs that campaign in that place.
 *
 * Everything here is pure. The TUI shell imports it; nothing flows back.
 * If this shape survives, these functions are what gets lifted into the real
 * codebase (`campaign.ts` / `place.ts`) and the shell gets deleted.
 */

export interface Place {
	/** Subdomain. `<slug>.bloomproject.us`. */
	slug: string;
	name: string;
}

export interface Campaign {
	/** First path segment. `<place>.bloomproject.us/<slug>`. */
	slug: string;
	title: string;
	/** Campaign-level content. Propagates to every poll that has not overridden it. */
	question: string;
	seedStatements: string[];
}

/** The join row: one comhairle Conversation, with its Polis step. */
export interface Poll {
	campaignSlug: string;
	placeSlug: string;
	/** comhairle `Conversation.organizationId`. Exactly one, and it gates writes. */
	hostOrg: string;
	/** Set when this poll's Host localised the campaign question. */
	questionOverride?: string;
	votes: number;
}

export interface World {
	places: Place[];
	campaigns: Campaign[];
	polls: Poll[];
	/** Which org the person driving admin belongs to. '*' = BLOOM super user. */
	actingOrg: string;
}

export const pollKey = (p: Pick<Poll, 'campaignSlug' | 'placeSlug'>) =>
	`${p.campaignSlug}@${p.placeSlug}`;

export const findPoll = (w: World, campaignSlug: string, placeSlug: string) =>
	w.polls.find((p) => p.campaignSlug === campaignSlug && p.placeSlug === placeSlug) ?? null;

export const questionOf = (w: World, poll: Poll) =>
	poll.questionOverride ??
	w.campaigns.find((c) => c.slug === poll.campaignSlug)?.question ??
	'(no campaign)';

/** Every place a campaign runs in. The admin "valid subdomains" list (George). */
export const placesOf = (w: World, campaignSlug: string) =>
	w.polls.filter((p) => p.campaignSlug === campaignSlug).map((p) => p.placeSlug);

/** Every campaign running in a place. What a Place root would have to index. */
export const campaignsIn = (w: World, placeSlug: string) =>
	w.polls.filter((p) => p.placeSlug === placeSlug).map((p) => p.campaignSlug);

// --- URL resolution ---------------------------------------------------------

export type Resolution =
	| { kind: 'poll'; poll: Poll }
	| { kind: 'redirect'; to: string }
	/** More than one campaign in this place: the root cannot pick for the user. */
	| { kind: 'place-index'; campaigns: string[] }
	| { kind: 'empty-place' }
	| { kind: 'unknown-place' }
	| { kind: 'no-such-campaign'; slug: string }
	/**
	 * The campaign exists but not here. `elsewhere` is every place it DOES run in,
	 * which under many-to-many is often more than one, so the error page can no
	 * longer offer a single "GO TO OREGON" button.
	 */
	| { kind: 'wrong-place'; slug: string; elsewhere: string[] };

export function resolve(w: World, subdomain: string, segment: string | null): Resolution {
	const place = w.places.find((p) => p.slug === subdomain);
	if (!place) return { kind: 'unknown-place' };

	if (segment === null) {
		const here = campaignsIn(w, place.slug);
		if (here.length === 0) return { kind: 'empty-place' };
		if (here.length === 1) return { kind: 'redirect', to: `/${here[0]}` };
		return { kind: 'place-index', campaigns: here };
	}

	const poll = findPoll(w, segment, place.slug);
	if (poll) return { kind: 'poll', poll };

	const campaign = w.campaigns.find((c) => c.slug === segment);
	if (!campaign) return { kind: 'no-such-campaign', slug: segment };

	return { kind: 'wrong-place', slug: segment, elsewhere: placesOf(w, segment) };
}

// --- Mutations --------------------------------------------------------------

export type Outcome = { ok: true; world: World; note: string } | { ok: false; reason: string };

/** Adding a place to a campaign creates its poll. This is the only way a poll appears. */
export function linkPlace(
	w: World,
	campaignSlug: string,
	placeSlug: string,
	hostOrg: string
): Outcome {
	if (!w.campaigns.some((c) => c.slug === campaignSlug))
		return { ok: false, reason: `No campaign "${campaignSlug}".` };
	if (!w.places.some((p) => p.slug === placeSlug))
		return { ok: false, reason: `No place "${placeSlug}".` };
	if (findPoll(w, campaignSlug, placeSlug))
		return { ok: false, reason: `${campaignSlug} already runs in ${placeSlug}.` };

	const poll: Poll = { campaignSlug, placeSlug, hostOrg, votes: 0 };
	return {
		ok: true,
		world: { ...w, polls: [...w.polls, poll] },
		note: `Created poll ${pollKey(poll)} owned by ${hostOrg}. In comhairle this is a new Conversation + Polis step.`
	};
}

/**
 * Removing a place from a campaign. The poll and its votes are the question:
 * a link table row deletes cleanly, a deliberation with 412 votes in it does not.
 */
export function unlinkPlace(w: World, campaignSlug: string, placeSlug: string): Outcome {
	const poll = findPoll(w, campaignSlug, placeSlug);
	if (!poll) return { ok: false, reason: `${campaignSlug} does not run in ${placeSlug}.` };

	return {
		ok: true,
		world: { ...w, polls: w.polls.filter((p) => p !== poll) },
		note:
			poll.votes > 0
				? `Unlinked ${pollKey(poll)}, ORPHANING ${poll.votes} votes and a Polis conversation. Deleting the link is not the same as deleting the deliberation.`
				: `Unlinked ${pollKey(poll)}. No votes, so nothing was lost.`
	};
}

export interface Propagation {
	changed: string[];
	/** Skipped because the poll's Host owns it and the acting org is not them. */
	blockedByOwner: string[];
	/** Skipped because this poll localised the field. */
	skippedOverride: string[];
}

/**
 * A campaign-level edit, fanned out to its polls. Two things stop it landing
 * everywhere: comhairle gives a Conversation exactly one owning organization,
 * and a poll may have localised the field (Utahns vs Central Oregonians).
 */
export function editQuestion(w: World, campaignSlug: string, question: string): Outcome {
	const campaign = w.campaigns.find((c) => c.slug === campaignSlug);
	if (!campaign) return { ok: false, reason: `No campaign "${campaignSlug}".` };

	const result: Propagation = { changed: [], blockedByOwner: [], skippedOverride: [] };
	for (const poll of w.polls.filter((p) => p.campaignSlug === campaignSlug)) {
		if (w.actingOrg !== '*' && poll.hostOrg !== w.actingOrg) result.blockedByOwner.push(pollKey(poll));
		else if (poll.questionOverride !== undefined) result.skippedOverride.push(pollKey(poll));
		else result.changed.push(pollKey(poll));
	}

	const world = {
		...w,
		campaigns: w.campaigns.map((c) => (c.slug === campaignSlug ? { ...c, question } : c))
	};

	const parts = [`${result.changed.length} poll(s) now ask it`];
	if (result.blockedByOwner.length)
		parts.push(`BLOCKED on ${result.blockedByOwner.join(', ')} (owned by another Host)`);
	if (result.skippedOverride.length)
		parts.push(`kept local wording on ${result.skippedOverride.join(', ')}`);

	return { ok: true, world, note: parts.join('; ') + '.' };
}

/** Localise one poll's question, the thing Utah and Oregon actually did. */
export function overrideQuestion(
	w: World,
	campaignSlug: string,
	placeSlug: string,
	question: string
): Outcome {
	const poll = findPoll(w, campaignSlug, placeSlug);
	if (!poll) return { ok: false, reason: `No poll ${campaignSlug}@${placeSlug}.` };
	if (w.actingOrg !== '*' && poll.hostOrg !== w.actingOrg)
		return { ok: false, reason: `${poll.hostOrg} owns this poll; you are ${w.actingOrg}.` };

	return {
		ok: true,
		world: {
			...w,
			polls: w.polls.map((p) => (p === poll ? { ...p, questionOverride: question } : p))
		},
		note: `${pollKey(poll)} now has its own wording and stops following the campaign.`
	};
}

// --- Conflicts the model allows ---------------------------------------------

/**
 * What this shape lets you build that the URL scheme cannot express. Anything
 * listed here is a decision the team still owes, not a bug in the code.
 */
export function conflicts(w: World): string[] {
	const out: string[] = [];

	for (const place of w.places) {
		const here = campaignsIn(w, place.slug);
		if (here.length > 1)
			out.push(
				`${place.slug}.bloomproject.us/ hosts ${here.length} campaigns (${here.join(', ')}). The Place root cannot pick one, so it needs an index page.`
			);
	}

	for (const campaign of w.campaigns) {
		const where = placesOf(w, campaign.slug);
		if (where.length > 1)
			out.push(
				`"${campaign.slug}" runs in ${where.length} places (${where.join(', ')}). A wrong-place 404 cannot offer a single corrective link.`
			);

		const orgs = new Set(
			w.polls.filter((p) => p.campaignSlug === campaign.slug).map((p) => p.hostOrg)
		);
		if (orgs.size > 1)
			out.push(
				`"${campaign.slug}" spans ${orgs.size} Hosts (${[...orgs].join(', ')}). No single org can edit all of its polls.`
			);
	}

	if (w.places.length && !w.polls.length) out.push('No polls: every place root is a dead end.');

	return out;
}

// --- Seed: the Utah / Oregon engagement as it actually ran -------------------

export const SEED: World = {
	actingOrg: '*',
	places: [
		{ slug: 'utah', name: 'Utah' },
		{ slug: 'oregon', name: 'Central Oregon' },
		{ slug: 'all', name: 'USA' }
	],
	campaigns: [
		{
			slug: 'ai',
			title: 'AI & Our Communities',
			question:
				'How can we all ensure the benefits of AI are widely shared and risks are responsibly managed?',
			seedStatements: ['AI should be taught in schools', 'Local jobs come first']
		}
	],
	polls: [
		{
			campaignSlug: 'ai',
			placeSlug: 'utah',
			hostOrg: 'Utah Common Ground',
			questionOverride:
				'How can Utahns ensure the benefits of AI are widely shared and risks are responsibly managed?',
			votes: 412
		},
		{
			campaignSlug: 'ai',
			placeSlug: 'oregon',
			hostOrg: 'Central Oregon Civic Action Project',
			questionOverride:
				'How can Central Oregonians ensure benefits of AI are widely shared and risks are responsibly managed?',
			votes: 380
		},
		{
			campaignSlug: 'ai',
			placeSlug: 'all',
			hostOrg: 'Bloom Project',
			questionOverride:
				'How can Americans ensure the benefits of AI are widely shared and its risks are responsibly managed?',
			votes: 95
		}
	]
};
