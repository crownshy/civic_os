# Brand: what the cascade forces

Backs #428.

**Throwaway.** Run `pnpm prototype:brands`. It imports the real
`packages/shared/src/data/brand.ts` and reads the real `theme.css`, so it cannot
drift from what ships. Delete it once the questions below have answers.

## The question

A Host wants its own look. The agreed shape is a cascade: deployment defaults,
overridden by the Host, overridden by the Campaign, plus an escape hatch for
custom CSS. This makes that concrete against the code that exists:

> If a Brand is a set of variables layered deployment → Host → Campaign, what
> does a Host actually get to change, and what stays BLOOM's?

## The shape under test

A Brand is `{ tokens, css }`. `tokens` is a curated allowlist of 17 of
`theme.css`'s variables; `css` is free-form `--name: value` declarations for the
rest. Both layers ride on metadata, the same trick a Place uses (ADR 0006):

```
theme.css                       shipped with the server
  ← Organization.metadata.brand   mirrored to Conversation.metadata.hostBrand
    ← Conversation.metadata.brand written by admin's Brand card
```

Named Brand, not Theme, because a Theme in this product is a topic tag on a
statement (`ThemeSummary`, `themeControversy`, admin's Theme Explorer). The two
would sit two tabs apart in admin.

## What it showed

1. **A rebrand reaches 17 of 59 variables.** The other 42 keep BLOOM's colours
   whatever the Host sets, and they are not obscure: `--destructive` is used in
   30 files, `--popover` in 6, `--input` in 9. A Host who sets their brand blue
   still gets BLOOM's error red on every validation message. Either the
   allowlist grows, or the unbrandable ones get derived from the brandable ones,
   or we accept that a Brand is a tint rather than a skin. Nobody has picked.

2. **The gradient used to eat the background.** `layout.css` painted `body` with
   `bg-background bg-gradient-primary`, and a background image covers the colour
   under it completely, so a Host setting `--background` saw no change at all.
   That is fixed: the gradients are gone (ADR 0010), all except the report's two
   dark bands. Those two are still outside the allowlist, so a rebranded Host
   gets BLOOM green there.

3. **Custom CSS cannot be rules.** ADR 0005 kept `class` out of Host copy
   because Tailwind's utilities are in the bundle and a Host could write
   `fixed inset-0 z-50 bg-white` and mount a redressing attack. Free-form CSS is
   the same attack with fewer steps. So `sanitizeBrandCss` keeps declarations and
   drops everything else: `body { position: fixed; inset: 0 }` comes out as
   nothing. That satisfies "let people add custom CSS" only in the sense of
   custom *properties*. Real rules need the participant page in an iframe, or a
   CSP with a nonce, before they are safe.

4. **The Host layer has no writer.** `Organization.metadata.brand` is the real
   home for it, and `/organizations` answers 401 anonymously, so civicos cannot
   read it. It has to be mirrored onto every Conversation the Host runs, the
   same way `metadata.poll` and `metadata.org` already are. Nothing writes that
   mirror yet: the admin card writes the Campaign layer only. A Host with four
   Campaigns is four writes that can disagree, and a Campaign reassigned to
   another Host keeps the old look until something rewrites it.

5. **Values have to be validated on read, not just on write.** `metadata` is
   `z.unknown()` and hand-editable in the backend, and every value ends up
   inside a declaration in a `<style>` element. `--primary: red; } html {
   display: none } .x {` is one PATCH away from a blank participant page, so
   `readBrand` checks each value against its kind and `brandCss` checks again at
   the render boundary.

## What this does not answer

- **Dark mode.** `theme.css` has a `.dark` block and civicos never sets the
  class, so it is dead there. A Brand emits one set of values. If dark mode
  becomes real, a Brand needs a dark half, and the `:root:root` specificity
  `brandCss` uses to beat the stylesheet would have to give way to something
  that does not also beat `.dark`.
- **Where Places sit.** The premise here is that a Brand belongs to a Host. If
  Places move onto Organizations, a Place is a plausible fourth layer, and ADR
  0006 and 0008 both change. Worth settling before the mirror gets built, since
  the mirror is per-Conversation either way.
- **What a Host sees while editing.** The admin card shows the inherited value
  as a placeholder and nothing else. There is no preview of the participant
  page, so a Host picks colours against a form, not against the screen they are
  changing.
