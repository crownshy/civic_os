# A Place is a custom Region, with its slug and areas on metadata

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

Related: ADR 0002 (Super user gate), ADR 0016 (Campaign areas), #404, #509,
crownshy/comhairle#1826.
