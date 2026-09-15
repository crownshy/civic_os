# civicos drops its gradients, except the report's two dark bands

Every gradient in `civicos` is now a flat colour. The two exceptions are
`--gradient-hero` and `--gradient-consensus`, the dark green bands on the report,
which stay.

## Why this needed writing down

#428 gives a Host a Brand: a set of CSS variables it can override per Campaign.
`--gradient-primary` made that impossible for the most obvious variable of all.
`layout.css` painted `body` with `bg-background bg-gradient-primary`, and a
gradient is a background _image_, so it covered `--background` completely. A Host
could set a page colour, have it stored, emitted and applied, and see nothing
change.

`brandCss` briefly worked around this by emitting `--gradient-primary: none`
whenever a Brand set a background. That workaround is gone with the token.

The rest went for a plainer reason: a two-stop fill is not brandable. A Host who
sets `--card` gets a card whose top half is their colour and whose bottom half
fades to something they did not choose.

## What was kept

The report's hero and consensus bands. They are a deliberate dark surface on a
light site rather than a surface tint, and flattening them would change the page
they anchor rather than simplify it.

They are also not in the Brand allowlist, so **they stay BLOOM green for every
Host**. That is a known gap, not an oversight; #428 tracks it.

## How the flattening was decided

Every two-stop fill collapsed to the stop carrying the colour, and the faded stop
was dropped as decoration:

| Was                                         | Now             |
| ------------------------------------------- | --------------- |
| `from-card to-card/70`                      | `bg-card`       |
| `from-background to-accent` (tinted avatar) | `bg-accent`     |
| `from-primary/20 to-primary` (bar fill)     | `bg-primary`    |
| `from-white to-white/80`                    | `bg-white`      |
| `from-orange-50 to-orange-100` (page)       | `bg-background` |
| `bg-gradient-primary` (15 sites)            | `bg-background` |

Two did not fit the rule and were judged: `VoteBar`'s white-to-grey bevel became
`bg-white`, and `HeroSection`'s `.bubble`, which faded from 18% white to nothing,
became a flat 12%.

## How this sits with the freeze

ADR 0003 freezes "any change to a `civicos` component's visual design" and ADR
0009 restates it as "token-driven only", with the test being whether a Host with
everything switched on sees the screen they saw before. **This change fails that
test on purpose.** It is a redesign, not configuration, and it was asked for
directly rather than derived from a Host switch.

The freeze is not lifted. It still covers the shared primitives ADR 0003 lists,
none of which is touched here: this is `civicos`'s own `lib/components/ui` and its
route-local components. The migration parked in `docs/component-strategy.md` is
unaffected.

## Consequences

- `GradientCard` is `PanelCard`. Its whole reason for existing was a gradient
  border drawn by nesting a div inside a gradient-filled one; with the gradient
  gone the nesting went too, and so did the `borderGradient` prop. Three report
  sections import it.
- `Button`'s `variant="gradient"` is now a misnomer, and always was: it renders
  `bg-white/10` with an inset shadow and an outline, never a gradient. Left alone
  because renaming it changes a component API for no visual gain, but it is the
  one thing left in the tree that greps as a gradient and is not one.
- `--gradient-primary` is gone from both copies of `theme.css`
  (`packages/shared` and `packages/civicos`) and from the `bg-gradient-primary`
  utility in `layout.css`. `admin` never used it.
- Two things that are not gradients came off in the same pass, both asked for
  directly. The contribute route turns `AppShell`'s side hairlines off
  (`border={false}`, the escape hatch `+error.svelte` already used); every other
  route keeps them. And the contribute screens sit on `--background` throughout:
  the voting screen was `--muted`, so it read as a yellow column on the page
  around the shell, and the demographics footer was `--accent` over a
  `border-secondary/70` hairline, so it read as a yellow tray under the
  CONTINUE button. That leaves `--muted` a report-only surface in `civicos`,
  which the preset notes in `packages/shared/src/data/brand.ts` now say.
- `Header` kept its exact colour: `from-[#FFEDD3] to-[#FFEDD3]/40` was one hex
  fading to itself, so flattening it to `bg-[#FFEDD3]` only removes the fade.

Related: #428 (Brand), ADR 0003 (freeze scope), ADR 0009 (what the freeze
protects).
