# A Host switch may change what civicos renders

[ADR 0003](0003-civicos-freeze-covers-components-not-data.md) freezes "any change
to `civicos` components that alters their rendering" and unfreezes `civicos` data
loading. Read literally, that lets civicos **fetch** a Host's configuration and
forbids it from **obeying** it, because obeying means rendering something else.

## Why this needed writing down

ADR 0003 was written for copy: the fields it lists (`whatsNext`,
`contextParagraphs`, the FAQ) all resolve to `conversation.X ?? region.X` at an
existing call site, so the component tree never changes shape. Every Host switch
since then does change it. #426 is the first: turning off Gender removes a card
from the About You screen, turning off Share removes a CTA from the end screen,
and turning every ask off removes the mid-poll checkpoints entirely. #363, #364
and #367 all land the same way.

Under 0003's letter that work is blocked, which is not what the freeze was for.

## What the freeze actually protects

The migration parked in `docs/component-strategy.md` moves `civicos` onto the
shared primitives. The risk it guards against is a shared `Card` or `Button`
being restyled underneath `civicos` while nobody is looking at `civicos`.
Rendering fewer of its own route-local cards is not that risk.

## Decision

- **Frozen**, unchanged: the markup of the shared primitives ADR 0003 lists, and
  any change to a `civicos` component's _visual design_. Token-driven only.
- **Not frozen**: showing or hiding a `civicos` route-local element on a value a
  Host configured, and the local state that reads it. The elements themselves
  keep the markup they have.

The test is whether a Host with everything switched on sees the screen they saw
before. If they do, the change is configuration; if they do not, it is a redesign
and the freeze still applies.

## Consequences

- #426 gates `ThankYouScreen`'s three ask cards and builds `AboutYouScreen`'s
  list from the switched-on categories. All-on renders what it rendered before.
- The switchable elements are route-local (`contribute/*.svelte`), so nothing
  shared moves. #364 and #367 inherit the same boundary.
- Definitions a Host configures live in `packages/shared/src/data/`, next to
  `place.ts`, so admin and civicos read one list. `demographics.ts` and
  `participant-asks.ts` moved there out of `admin`'s `$lib/config` on #426.
- The parked migration is unaffected. Steps 2 to 4 remain parked.
