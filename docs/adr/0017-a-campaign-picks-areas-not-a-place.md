# A Campaign picks areas, not a Place

A Host no longer names a Place. They pick the states, counties and cities a
Campaign runs in on the map (ADR 0016), and the Place pages it is listed on
follow from those areas. Places themselves are made by super users, as a name
plus the areas they cover (#404). This supersedes ADR 0008, the "who writes it"
half of ADR 0006, and the Place suffix on Conversation slugs from ADR 0007 and
ADR 0014. Decided in #508, built in #580.

## Why

A typed Place was free text on every Campaign. Two Campaigns in Utah could spell
it two ways and land on two Place pages, and nothing enumerated Places to check
against. CONTEXT.md already described the model we wanted, where a Place is
derived from the areas and nobody picks one. The map picker made the areas
real, so the typed field was the last thing in the way.

## What changed

- **Setup and `/c/new` have no Place field.** The Identity card's row is now
  "Where it runs": the area chips and an Edit areas button.
- **Nothing writes `metadata.place`.** Campaigns made before this keep theirs,
  and civicos still lists them by it until the Place page reads Places from
  comhairle (#579). Utah and Oregon get areas in #578.
- **Slugs are what the Host typed.** No `-<place>` suffix on create, and Setup
  no longer renames a slug when a Place changes, because there is no Place to
  change. Existing slugs like `ai-utah` stay as they are: they are live links.
  `conversationSlugFor`, `campaignSlugFrom` and `rescopedSlug` are gone.
- **The dashboard labels a Campaign with its area names**, not a Place name.

## Consequences

- **A slug is unique across every Host.** Two Hosts cannot both have `ai`. The
  suffix used to make that automatic; now the Host picks another slug when
  comhairle answers 409, which the form already says beside the field.
- **New Campaigns are on no Place page until #579.** They are still served at
  `/<slug>` from the moment they exist; only the listing is missing.
- **A Campaign with no areas is listed nowhere.** Areas stay optional on create,
  the same as the Place was.

Related: ADR 0006 (Place on metadata), ADR 0008 (one Campaign, one Place),
ADR 0014 (Campaign at the root), ADR 0016 (areas on metadata), #508, #580.
