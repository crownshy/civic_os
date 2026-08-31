# Host copy is sanitized where it renders, and carries no classes

Every `{@html}` in `civicos` passes its value through `sanitizeHostHtml` from
`@civicos/shared/sanitize`. The allowlist permits prose tags and `href`,
`target`, `rel`. It does not permit `class`. Styling for host copy belongs to
the container that renders it, through `[&_a]:…` descendant utilities.

## Why this needed writing down

`regions.ts` is developer-authored and checked into the repo, so `{@html}` was
doing its job: the copy carries `<strong>` and `<a>` on purpose, and the only
person who can write it is someone who can already push code.

#398 moves that content to Campaign configuration served by the API, and
milestone 12 lets Hosts edit it in real time. On the day that lands, 16 render
sites across six files become places where anyone who can edit a Campaign, or
anyone who takes over a Host account, gets script execution in every
participant's browser. Retrofitting a sanitizer across 16 call sites after the
fact is harder than picking the shape first, so #409 landed ahead of #398.

## Decision

**Sanitize on the way out, not on the way in.** Comhairle validating on write
would not cover rows written before that validation existed, and would not cover
`regions.ts` at all, which never passes through the backend. One change at the
render boundary covers both sources. Write-side validation is still worth adding
as a second layer.

**The tag allowlist is the union of two known producers.** Admin's Setup editor
runs Tiptap StarterKit with `code`, `codeBlock` and `horizontalRule` off and
headings capped to 2 and 3 (`packages/admin/src/lib/components/RichTextEditor.svelte`),
which emits `p h2 h3 ul ol li blockquote br a strong em u s`. `regions.ts` adds
`span`. `h4` is allowed because #414 demotes heading levels on render. `b` and
`i` are allowed because a paste from Word or Google Docs produces them and
silently dropping a Host's emphasis reads as a bug.

**No `class`.** Tailwind's utilities are in the bundle, so an allowlisted `class`
would let a Host write `fixed inset-0 z-50 bg-white`, cover the page, and mount a
redressing attack. This is the constraint most likely to be reversed by someone
who does not know why it is there, which is the reason for this ADR.

The cost is that presentation moved to the surface. Twelve wrappers in `civicos`
gained `[&_a]:text-destructive [&_a]:underline` or similar to reproduce what the
stripped attributes used to do, and the now-inert `class` attributes came out of
`regions.ts` so the source stops looking like it styles anything. Admin already
worked this way: `RICH_TEXT_PROSE_CLASS` in `packages/admin/src/lib/utils/rich-text.ts`
styles descendants because Tiptap owns the element.

**Hrefs are restricted to `http`, `https`, `mailto` and `tel`.** The check
resolves the value against a throwaway base so relative targets (`#context`,
`/report`) come out as https rather than needing a pattern of their own. A
`target="_blank"` link always gets `rel="noopener noreferrer"`; any other target
is dropped.

**Urls bound to an attribute go through `safeHref`.** Svelte does not vet
attribute values, so `href={partner.url}` would run a `javascript:` url on click.
`safeHref` applies the same protocol check and returns undefined, which drops the
attribute.

**HTML built by string concatenation is not sanitizable, so it is gone.** The
landing and campaign pages used to build partner links with
`` `<a href='${p.url}'>${p.name}</a>` `` and render them through `{@html}`. A
sanitizer would have masked that; rendering the anchors as markup fixes it. The
Oxford-comma logic those two call sites shared now lives in
`packages/civicos/src/lib/utils/list.ts`.

## How this sits with the civicos freeze

ADR 0003 scoped the freeze to shared component markup and carved out `civicos`
data loading. This change is neither: it alters what `civicos` components
render. The carve-out extends to security fixes at existing render sites,
on the same reasoning as 0003. The freeze exists so shared primitives are not
restyled underneath `civicos` while the migration is parked, and none of
`Card`, `Badge`, `Link`, `MonoLabel`, `input`, `popover`, `form`, `carousel`,
`command` or `spinner` is touched here. The parked migration in
`component-strategy.md` is unaffected.

## Consequences

- #414 inherits a settled tag list. Its remaining work is the block container,
  heading demotion, and civicos prose styling, not what is allowed through.
- Sanitizing at the render boundary means it runs per render, and on the server
  that is jsdom parsing. When #398 moves this content into a `load` function,
  sanitizing once there is cheaper. The render-boundary calls should stay
  regardless, so a future client-side fetch cannot route around them.
- `isomorphic-dompurify` is pinned to `~3.19.0`. From 3.20 it requires Node
  `^22.22.2`, above the 22.20.0 in `.nvmrc` and the `node:22` Docker base. The
  pin needs revisiting when those move.
- A Host cannot style their own copy at all, only structure it. If that turns
  out to be too little, the answer is named affordances the editor offers (a
  callout block, say) that map to app-owned classes, not opening the `class`
  attribute.
- Two latent bugs in `regions.ts` surfaced and were fixed while doing this: a
  `<span class='font-bold >` with an unclosed quote that swallowed the following
  text, and a `<Link href=…>` in Utah's `goDeeper`, which is a Svelte component
  name inside an HTML string. The browser parsed it as the void `<link>`
  element, so that address had never rendered as a link.
