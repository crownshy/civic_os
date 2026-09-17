# A Color Scheme replaces the Brand

#428 gave a Host a Brand: 17 CSS variables it could set per Campaign, a box for
extra `--name: value` declarations, and a Host layer mirrored onto every
Conversation as `metadata.hostBrand`. The redesign drops all of that. Admin
offers a row of named schemes, the Host picks one, and civicos paints that
scheme's accent.

## Decision

- A Color Scheme is an id from `COLOR_SCHEMES` in
  `packages/shared/src/data/color-scheme.ts`, stored on
  `Conversation.metadata.colorScheme`. The hexes stay in code.
- A scheme sets `--primary`, `--ring` and `--secondary`. The mocks keep the white
  page, brown body text, red Disagree and END, and cream Unsure the same in every
  scheme, so a scheme does not touch them.
- Green is the default and is `civicos/lib/styles/theme.css` itself. A Campaign
  with no scheme emits nothing. `color-scheme.test.ts` fails if the two drift.
- The list is Green, Slate and Plum from the redesign, plus Terracotta, Blue,
  Purple, Pink and Teal from the old swatch row. The old Tailwind green was
  dropped because it sat next to BLOOM's green.

## Why

The Brand was an exploration (#428 says so). It answered "can a Host restyle
civicos" and raised questions nobody wanted to own: how many of the 60 variables
a Host gets, who writes the Host mirror, what custom CSS may contain. The design
answered with a picker. With no Host-supplied values, nothing reaches a `<style>`
element that did not come from our constants, so the sanitizer and per-value
validation went too.

## Consequences

- Deleted: `shared/data/brand.ts`, admin's `BrandDialog`, `BrandFields`,
  `brand-draft.ts` and the phone preview under `setup/preview/`, the
  `prototypes/campaign-brands` TUI, and `SEED_BRAND` in `seed-dev.sh`.
- Metadata written by the Brand (`metadata.brand`, `metadata.hostBrand`) is
  ignored. It only ever existed on `stage`. A Campaign that picked a swatch there
  shows Green until someone picks again.
- `theme.css` changed its defaults to match the redesign: `--background` is
  white, `--secondary` is dark green instead of `#a6722e`, and `--ring` is the
  primary. The shared copy in `packages/shared` was left alone because admin
  reads `--secondary` from it.
- The landing pill, title and place label, and the voting compose strip, now read
  `--primary`. Other civicos surfaces still hardcode colours the mocks give to the
  accent (`bg-[#FFEDD3]` on `Header`, `bg-yellow-950` in `StickyNav`), and do not
  follow a scheme yet.
- Slate and Plum hexes were read off screenshots, not Figma. Correct them in
  `COLOR_SCHEMES` when the Figma values are in hand.
- The report's hero and consensus gradients (ADR 0010) are still BLOOM green in
  every scheme.

Supersedes the Brand shape described in #428. Related: ADR 0006 (why metadata),
ADR 0010 (gradients).
