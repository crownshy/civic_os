# The Campaign moves to the root

Participant URLs no longer carry the Host. Each Campaign lives one segment off
the root:

| Page | URL |
| --- | --- |
| Campaign page | `/<campaign>` |
| Poll | `/<campaign>/poll` |
| Events | `/<campaign>/events`, `/<campaign>/events/<event>` |
| Report | `/<campaign>/report` |
| Place | `/<place>` |

`<campaign>` is the Conversation slug (`ai-utah`). This supersedes the URL shape
in ADR 0007 and ADR 0011. The rest of ADR 0011 stands: no Place in the
hostname, one host serves every Campaign. Decided in #457.

## Why

The `<org>` segment never did anything. civicos ignored it on resolution
because an Organization has no URL-safe id and `/organizations` is 401 to the
participant app, so admin slugified the Host's display name and a rename changed
it. `/conversations/` was there to mirror comhairle's own URLs, which
participants never see. The Conversation slug is unique and already names the
Place, so it is the whole address on its own.

The Place stays a path. A subdomain per Place is what ADR 0011 removed, for the
certificate, the Polis allowlist entry and the split session each one cost. If
`<place>.bloomproject.us` ever comes back as a vanity address, it should only
redirect to `/<place>` and never serve a Campaign.

## What changed

- **One route answers `/<slug>`.** SvelteKit allows one dynamic segment per
  level, so `routes/[campaign]/+layout.server.ts` resolves the slug as a
  Campaign and, when no Campaign has it, as a Place. The root page renders
  `CampaignLanding` or `PlaceListing` off `data.kind`. Poll, events and report
  sit in the `(campaign)` group, and `requireCampaign` there 404s a Place.
- **`/contribute` is now `/poll`.** `CAMPAIGN_PAGES` in
  `@civicos/shared/data/place` names the pages, so admin's poll link and the
  civicos route cannot drift.
- **Old links redirect.** `/<org>/conversations/<slug>/...` answers 308 to
  `/<slug>/...`, with `contribute` mapped to `poll` and the query string kept.
  Those links are in emails and shared posts.
- **`participantUrl(conversationSlug, base)` and `campaignPath(slug, ...rest)`**
  lost their org argument. `UNKNOWN_ORG_SLUG` is gone.

## A slug that is both a Campaign and a Place

The Campaign wins. A Place only gets its page when no Campaign answers to the
slug.

#457 assumed the old rule, where the Place won. That stops working once a
Campaign lives at `/<campaign>`: a Campaign is listed on its Place's page by its
own address, so if the Place won, a Campaign slugged the same as its Place would
link from that page straight back to the listing. Legacy Utah is that case today
(slug `utah`, Place `utah`). The cost is that such a Place has no page of its
own. Its Campaigns are still listed at `/conversations`.

The Place lookup only runs on a Campaign miss, so a Campaign page costs no extra
request. A miss whose Place list cannot be read answers 503 rather than 404,
because the slug may well be a Place.

## Consequences

- **More slugs are taken.** `api` and `conversations` are civicos routes at the
  root, so a Campaign slugged either would be unreachable.
  `PARTICIPANT_RESERVED_SLUGS` lists them, and admin's create form and Setup
  rename refuse them along with `new`. A Place named "Conversations" is still
  not refused.
- **`metadata.org.slug` is unread.** Admin still writes it on publish. The name
  and URL in `metadata.org` are still used to credit the Host on event pages.
- **Editing a Place still moves the Campaign's URL**, as under ADR 0011, because
  the Place suffix is part of the slug.

Related: ADR 0006 (Place on metadata), ADR 0007 (URL scheme), ADR 0011 (Place
leaves the hostname), #349, #457.
