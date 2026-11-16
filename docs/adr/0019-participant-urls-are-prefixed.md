# Participant URLs are prefixed: `/c/` for Campaigns, `/p/` for Places, `/h/` for Hosts

Each kind of page gets its own first segment:

| Page | URL |
| --- | --- |
| Campaign | `/c/<slug>` |
| Poll, events, report | `/c/<slug>/poll`, `/c/<slug>/events/...`, `/c/<slug>/report` |
| Place | `/p/<slug>` |
| Host | `/h/<slug>`, kept free for a Host page later |

This supersedes the URL table in ADR 0014. Agreed with George in #583.

## Why

Under ADR 0014 a Campaign and a Place both answered at `/<slug>`. One layout
tried the slug as a Campaign, then as a Place, and the Campaign won. That cost:

- **A Place could lose its page.** Legacy Utah is slugged `utah` as a Campaign
  and as a Place, so the Place had no page.
- **Every Place request missed first.** A Place page only loaded after
  `GET /conversation/:slug` came back 404.
- **Slugs had to be reserved.** A Campaign slugged `api`, `conversations` or
  `profile` was shadowed by the static route, so admin refused them.
- **The namespaces would only grow.** Places become Regions with their own slugs
  (crownshy/comhairle#1826), and comhairle Conversation slugs and Region slugs
  should not have to avoid each other.

With a prefix per kind, a slug only ever means one thing.

## What changed

- **`routes/c/[campaign]`** is the Campaign. Its layout no longer falls back to a
  Place, so the `(campaign)` group and `requireCampaign` are gone; poll, events
  and report sit directly under it.
- **`routes/p/[place]`** is the Place page. It still lists the directory
  filtered by `metadata.place` until #579 lists by the Place's areas.
- **`campaignPath()` and `placePath()`** in `@civicos/shared/data/place` build
  `/c/...` and `/p/...`. They are still the only code that writes the shape.
- **`PARTICIPANT_RESERVED_SLUGS` is gone.** Admin only refuses `new`, its own
  route under `/c/`.

## Old links redirect

Root links are in emails and shared posts, so they 308 with the query string
kept (`$lib/config/legacy-urls.ts`):

- `/<slug>/<page>/...` goes to `/c/<slug>/<page>/...`. A Place never had pages.
- A lone `/<slug>` is resolved the way ADR 0014 did: a Campaign comhairle knows
  (a draft or an outage counts, so the Campaign page can explain itself) goes to
  `/c/`, a Place with listed Campaigns to `/p/`, and anything else to `/c/`,
  where the 404 is shown.
- `/<org>/conversations/<slug>/...` goes straight to `/c/<slug>/...`, with
  `contribute` still renamed to `poll`.

## Open

Every civic_os Campaign has a Host, since admin only creates them under one.
`/h/<host>/<slug>` stays possible for a Host's Campaigns once Hosts have a URL
slug in comhairle. If Conversation slugs stop being globally unique, `/c/<slug>`
has to move under the Host anyway.

Related: ADR 0011 (Place leaves the hostname), ADR 0014 (Campaign at the root),
ADR 0018 (Place is a Region), #579, #583, crownshy/comhairle#1826.
