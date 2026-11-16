# A Place is a custom Region, with its slug and areas on metadata

> **Areas are links now (2026-11-16, #578).** comhairle imported the Census state
> boundaries, and Utah and Oregon were set up as Regions with those states
> linked in comhairle's own Regions screen. `/places` now reads and writes a
> Place's areas as the Region's area links, so both screens edit the same thing.
> See "Areas moved to links" below. The slug is still on metadata.

Super users create Places at `/places` in admin (#404). Each Place is a comhairle
Region of type `custom`. Its name is the Region's own name. Its slug and its
areas are stored on `Region.metadata` as `{ slug, areas }`, where `areas` is the
same `{ geoid, level, name }` list a Campaign stores (ADR 0016).

## Why metadata and not area links

The Region model has room for both, and neither is usable yet:

- **No slug column.** crownshy/comhairle#1826 asks for one. Until then the slug
  is derived from the name with `toPlaceSlug()` and stored in metadata, and
  admin refuses a second Place on the same slug, since nothing in comhairle
  would.
- **No areas to link.** `SetRegionAreaLinks` takes comhairle area ids, and
  states, counties and cities are not imported yet (#509). The picker still runs
  on seeded data, keyed by GEOID, so the GEOIDs are what can be stored.

Moving off metadata later is a lookup from GEOID to area id plus a slug copy,
the same path ADR 0016 describes for Campaigns.

## Consequences

- **The slug follows the name.** Renaming "Central Oregon" changes its slug. No
  public page reads a Place's slug yet (#579), so nothing breaks today; once one
  does, a rename moves that page.
- **The name is translated text.** `UpdateRegion` cannot change it, so a rename
  writes a translation against the text content id that the metadata patch
  returns, in `en`.
- **Every Region shows as a Place.** Regions made before this have no stored
  slug or areas. They list with a slug derived from their name and no areas
  until someone edits them.
- **Delete can be refused.** A workflow's `region_id` references the Region
  without a cascade, so comhairle refuses to delete a Region still in use. The
  page shows that error and does not try to work around it.

## Areas moved to links

The picker still works in Census GEOIDs from its seeded data. On save, admin
lists comhairle's areas for each picked state (`tag=statefp:XX`), reads each
one's GEOID from its tags (a `geoid:` tag, or the Census `statefp` plus
`countyfp` or `placefp`), and links the matching ids with
`SetRegionAreaLinks`. A pick with no comhairle boundary blocks the save and is
named in the error, so nothing is silently dropped. Today that means only
states can be saved; counties and cities follow once they are imported.

A Place saved before this kept its areas on metadata. Those still show until
the next save, which links them and clears `metadata.areas`.

The Region's slug falls back to its `official_id` before its name, since the
Regions created in comhairle carry one (`utah`, `oregon`).

Campaign Setup is unchanged: area reads are super admin only, and Hosts pick
areas there (#561).

Related: ADR 0002 (Super user gate), ADR 0016 (Campaign areas), #404, #509,
crownshy/comhairle#1826.
