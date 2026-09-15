# The Place leaves the hostname

A Place is no longer a subdomain. Every Campaign is served from one host at

    /<org>/conversations/<conversation-slug>

and a Place is a page at `/<place-slug>` listing the Campaigns running there.
This supersedes the `<place>.bloomproject.us` half of ADR 0007 and the "a Place is
the subdomain" framing in ADR 0006. The `/<org>/conversations/` shape, the
decorative `<org>` segment and the rest of ADR 0007 stand.

## Why

A subdomain per Place cost three things for every new Place:

1. **A certificate.** Staging's ingress asks cert-manager for
   `*.stage.bloomproject.us`, and both ClusterIssuers only have an HTTP-01
   solver, which cannot issue a wildcard. Each Place needed its own ingress host
   and its own certificate.
2. **A Polis allowlist entry.** Polis's `DOMAIN_WHITELIST` names `utah.`,
   `oregon.` and `testing.bloomproject.us` one by one, and it checks the host of
   the page embedding a poll against that list.
3. **A separate session.** The `auth-token` cookie and localStorage are per
   origin, so a participant who joined in one Place had no session in another.

None of that is needed to tell two Campaigns apart. The Conversation slug
already carries the Place (`ai-utah`, from `conversationSlugFor`), and
`GET /conversation/:idOrSlug` resolves it from the path alone.

## What changed

| Was | Is |
| --- | --- |
| `utah.bloomproject.us/<org>/conversations/ai` | `<host>/<org>/conversations/ai-utah` |
| `/<campaign-slug>` redirects to that Campaign | `/<place-slug>` is the Place page |
| region defaults picked by the subdomain | picked by the Campaign |
| a Campaign 404s under another Place's subdomain | any host serves any Campaign |
| admin prefers `regions.ts`'s `shareUrl` for Utah and Oregon | every share link is derived |

- **The campaign segment is the whole Conversation slug.** Without the
  subdomain, `/ai` cannot say whether it means `ai-utah` or `ai-oregon`. If
  comhairle scopes slugs per Host, the segment can shorten again; the lookup is
  `campaignCandidates()`, in one place.
- **The region behind a Campaign comes from the Campaign.** `regionForCampaign()`
  takes the legacy `regions.ts` entry that owns the Conversation id, then the one
  the slug names, then the catch-all. `hooks.server.ts` no longer sets
  `locals.region`, and the root layout's region is always the catch-all, for the
  pages that are not a Campaign.
- **The Place page is the directory, filtered.** A Place is still not a record
  (ADR 0006), so `/<place-slug>` lists the open Campaigns whose Place has that
  slug. A slug no open Campaign carries is a 404, except a legacy region slug,
  which redirects to its Campaign so the old `/utah` and `/oregon` links keep
  working.
- **`participantUrl(conversationSlug, orgSlug, base)` lost its Place argument.**
  `placePath()` builds the Place page link.

## Legacy hosts

Production's ingress still lists `utah.`, `oregon.`, `testing.` and
`all.bloomproject.us`, and production admin's participant base is
`bloomproject.us`, which that ingress does not list. A cross-host redirect would
send live links to a host that answers nothing, so there is none. A Campaign
resolves on whatever host it is asked under, and only the root `/` of those four
hosts keeps its old behaviour of opening that region's Campaign. That is the one
hostname read left (`routes/+page.ts`).

Putting production on a single host is a deploy change (ingress hosts, the
participant base, the Polis allowlist) and is not part of this.

## Consequences

- **One origin, one account.** Someone who joined Utah arrives at Oregon already
  signed in and gets CONTINUE instead of the join form. CONTINUE now registers
  them on that Campaign's workflow (`session.enterCampaign`), which only `join`
  did before. Poll state was already stored per Conversation id
  (`session-storage.ts`), so a second Campaign does not resume the first one's
  votes.
- **Editing a Place moves the Campaign's URL.** Setup rescopes the Conversation
  slug when the Place changes, and the slug is the address, so a link shared
  before the edit stops resolving. The subdomain moved in the same situation
  before, so the breakage is not new; it is now a path change instead of a DNS
  one.
- **Some first segments are taken.** `/conversations`, `/campaign` and `/api` are
  static routes and win over `[place]`, so a Place slugged one of those has no
  page. Nothing stops a Host naming a Place "Conversations" yet.
- **The zip redirect stays on the host it started on.** A Utah zip entered on the
  Oregon Campaign goes to the Utah Campaign's path, not to `utah.`.
  `getRegionUrl`, `getRegionBySubdomain` and `apexHost` are gone;
  `extractSubdomain` stays for the root redirect.
- **Sharing still uses `regions.ts`.** `SharePanelContent` and `/campaign/ai`
  share `region.shareUrl`, a Place subdomain, and for a Campaign created in admin
  that is the catch-all's. That was already wrong before this and is not fixed
  here. `/campaign/ai` also registers an email against the root layout's region,
  which is now always the catch-all; on `utah.` it used to be Utah's.

Related: ADR 0006 (Place on metadata), ADR 0007 (URL scheme), ADR 0008 (one
Campaign, one Place), #349 (URL scheme).
