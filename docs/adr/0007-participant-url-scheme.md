# The participant URL is `<place>/<org>/conversations/<campaign-slug>`

The participant URL mirrors comhairle's own:

    <place>.bloomproject.us/<org>/conversations/<campaign-slug>

| Was | Is |
| --- | --- |
| `/` | redirects to the Place's configured Campaign |
| `/<campaign-slug>` | `/<org>/conversations/<campaign-slug>` |
| `/<campaign-slug>/contribute` | `/<org>/conversations/<campaign-slug>/contribute` |
| `/<campaign-slug>/conversations/<event>` | `/<org>/conversations/<campaign-slug>/events/<event>` |
| `/<campaign-slug>/report` | `/<org>/conversations/<campaign-slug>/report` |

The events route had to move. It already used `/conversations/<slug>` for live
event pages, which collides with the new campaign segment; leaving it would have
produced `/<org>/conversations/<campaign>/conversations/<event>`. It is `/events`
now.

`/campaign/ai` stays at the root. It is a static explainer, not a Campaign
surface.

## The `<org>` segment is decorative

civicos resolves a Campaign from the slug and ignores the org. It has to:

- An Organization has **no URL-safe identifier**. The DTO is `id` (UUID), `name`,
  `description`, `mission`, `contactEmail`, `externalUrl`, `orgType`, `regions`,
  `metadata`. A slugified display name is the only option.
- `GET /organizations` and `GET /organizations/:id` are **401** anonymously, and
  the public Conversation payload carries `organizationId` and no name, so the
  participant app has nothing to validate against.
- There is **no endpoint taking (org, slug)**, so the segment cannot narrow the
  lookup even if it were trusted.

Two consequences, both deliberate:

1. **Renaming a Host changes the segment, and old links keep working**, because
   nothing checks it. That is the saving grace of a decorative segment, not an
   oversight.
2. **A wrong org in the URL still serves the Campaign.** Do not "fix" this into
   a validated segment without an org slug on the backend and an anonymous read;
   doing so breaks every link already shared.

Admin mirrors the Host name onto `metadata.org` on publish, for the same reason
it mirrors the poll: the participant app cannot resolve it itself.

## Legacy URLs

`/<campaign-slug>` now matches `[org]` with nothing after it. Utah and Oregon are
live and their links are in the wild, so `[org]/+page.ts` treats a lone segment
as a Campaign slug and 308s to the canonical path. The Place root redirects into
that same shape rather than building the canonical path itself, so the rule lives
in one place.

## Every Campaign has a participant site from creation

A Place is no longer required to be served. The path identifies the Campaign, so
an unpublished one is served from the **apex**; publishing to a Place moves it to
that subdomain. A Campaign that *has* a Place is served only from there, which is
the check that stops any subdomain serving any Campaign (`getRegionBySubdomain`
falls back rather than failing, so it never rejects anything on its own).

This supersedes the earlier rule that a Campaign with no Place is a 404, and
retires `ServedCampaign`.

## The one definition of that URL

`participantUrl(placeSlug, campaignSlug, orgSlug, base)` in
`@civicos/shared/data/place` builds the absolute URL and `campaignPath()` builds
the path half that internal links use. Between them they are the only place the
scheme is written down as code. Admin renders every
Campaign's share link from it (`toSummary`), civicos routes to match, and the
apex comes from `PUBLIC_PARTICIPANT_BASE_URL` rather than being derived from
admin's own hostname, because the two apps are separate deployments.

Before this, a share link came from `regions.ts`'s `shareUrl` string, which
existed for exactly four entries, so every Campaign created in admin had no
participant link at all. It is derived now. A legacy region's configured URL
still wins, because those hostnames are live and predate the rule.

If the scheme changes again (#349 is still open), the change is these two
functions plus the civicos route directory. Nothing else builds the URL by hand. It is a static explainer, not a Campaign
surface, and its name predates this scheme.

## Why now, with #349 open

#349 is about the wider URL scheme and was parked pending a team decision. This
is narrower and was blocking: with one Campaign per subdomain hardcoded in
`regions.ts`, a Place could never host two Campaigns, and the Campaign a URL
referred to was invisible in the URL. Routing under the slug is what makes the
resolution in `campaign.ts` mean anything.

If the team lands a different scheme, the change is a directory rename plus the
`params.campaign` reads. The resolution logic does not move.

## A Campaign is only reachable from its own Place

Once it has one. `chile.bloomproject.us/<org>/conversations/<slug>` 404s for a
Campaign published to Utah. Decided with Stuart, 2026-08-28; narrowed above so
that a Campaign with no Place is served from the apex instead of 404ing.

**No corrective link (2026-08-28).** The 404 used to carry an `elsewhere` and the
error page offered a "GO TO OREGON" button. It is gone, along with
`App.Error.elsewhere` and `urlForPlace()`.

It was removed anticipating many-to-many, where a Campaign runs in several Places
at once and there is no single right address to offer. ADR 0008 then narrowed the
model back to one Campaign per Place, which would make the link expressible
again. It stays out: less code, and it becomes wrong the moment the wider model
lands.

This needs the Place to be keyed on the Conversation, not on the request.
`getRegionBySubdomain` falls back rather than failing, so deriving the Place
from the subdomain's region would make every Campaign look like it belonged
wherever it was asked for, and the check would reject nothing.
`placeForConversation()` reads `metadata.place` first, then the legacy
`regions.ts` entry that owns that Conversation id.

A Campaign that resolves to no Place at all is also a 404: it has no address
under this scheme. That is why routes take `ServedCampaign` rather than
`Campaign`.

There is no catch-all. A Campaign is not automatically reachable from every
Place, and nothing auto-creates a per-Place copy of a Conversation. Whether
Campaigns should ever opt into a catch-all is open.

## A slug that names nothing is a 404

`campaignCandidates()` no longer trails a generic fallback. A URL naming a
Campaign is an address, so serving a different Campaign under it would be a lie.
The one exception is a legacy region: Utah and Oregon predate stored Campaigns,
so if the backend is unreachable, `/utah` still renders from `regions.ts` rather
than going dark. A slug matching no region and no Conversation is a 404.

## The landing page is the only entrance

Voting needs a zip code. It selects the Polis conversation, and it is the only
geography a participant ever gives us, so a `/contribute` link shared between
friends must not skip the page that asks for it. `[campaign]/contribute/+page.ts`
redirects anyone without a session back to `/<campaign-slug>`.

That check runs in the browser, because the session is `localStorage`. On a cold
load the server renders the page's loading shell and the redirect happens at
hydration; a returning participant keeps their bookmark, and someone arriving
cold gets bounced. It is a funnel, not an authorization boundary: anyone can
forge the localStorage entry, and nothing behind it is secret. If it ever needs
to be enforced, the zip has to move into a cookie so a server load can see it.

## What per-org slugs will break

Comhairle is making a slug unique per **organization** rather than globally, so
comhairle URLs become `/<org_name>/conversations/<conversation_slug>` (Stuart,
2026-08-28). That invalidates the lookup this file rests on:
`GET /conversation/:idOrSlug` cannot resolve a bare slug once two orgs can both
own `ai-and-communities`.

Civic OS cannot just copy comhairle's fix, because its first segment is a Place
and **a Place is not one-to-one with an organization**. So the open question is
how `<place>/<slug>` narrows to a single Conversation: whether a Place resolves
to a set of orgs, whether the Campaign lookup gains a Place filter, or something
else. Nothing here should grow further until that is answered.

The upside is that per-org slugs remove the reason this came up: the same
deliberation in Utah and Dundee is two Conversations under two Hosts, and both
can be `ai-and-communities`.

**Resolved by scoping the slug to the Place (2026-08-28).** Conversations are
slugged `<campaign>-<place>` (`ai-utah`, `ai-oregon`, `ai-all`) via
`conversationSlugFor()`.

Under ADR 0008's one-Campaign-one-Place rule this is not needed to disambiguate:
each Campaign has one poll. It is kept because it makes slug uniqueness automatic
rather than the Host's problem, and because it is exactly the key a sibling poll
would need if many-to-many ever lands. The public URL is unchanged, still
`utah.bloomproject.us/ai`; the suffix is how the pair is looked up.

That turns the worry above on its head. The Place in the subdomain is no longer
decorative, it is half the lookup key, and `<place>/<slug>` narrows to a single
Conversation using only `GET /conversation/:idOrSlug`, which is public and takes
a slug. No campaign entity, no metadata read, no new endpoint. It also means
admin can group a Campaign's polls from `ListConversations` alone, which returns
`slug` but not `metadata`.

Admin applies it automatically: saving the Place on Setup rescopes the
Conversation slug in the same action (`rescopedSlug()`), so a Host names a Place
and never types a slug. Moving Utah to Oregon gives `ai-oregon`, not
`ai-utah-oregon`; clearing the Place strips back to the bare Campaign slug; and a
slug that already ends in the Place it is being scoped to is left alone.

**Legacy regions are exempt.** Utah and Oregon predate this and their slugs are
pinned in `regions.ts`, so an edit to their Place must never rename them
(`campaign.isLegacyRegion`).

The rule that makes it safe: **derive forward, never parse back.**
`ai-central-oregon` is `ai` in `central-oregon` or `ai-central` in `oregon`, and
the string does not say which. `campaignSlugFrom()` matches against the known
Place slugs, longest first, and never splits on a hyphen.

Related: ADR 0006 (Place on metadata), `docs/regions-migration.md`, #349.
