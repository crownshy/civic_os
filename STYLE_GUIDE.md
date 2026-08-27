# Civic OS Style Guide

## Introduction

This guide is the working agreement for how we write and maintain the Civic OS frontend.
It exists to get new engineers (and LLM agents) up to speed faster, to give PR reviews a
shared standard to point at, and to cut the low-level decisions that slow us down.

It is a living document, not a hard rulebook. Anyone can propose a change. Keep it up to
date so we have a single source of truth.

**How to use it:**

- Reference it when you are unsure how to approach something.
- Link to it in PR comments instead of re-explaining the same feedback.
- Use personal judgement when circumstances demand it.
- **When the same feedback comes up a second time in review, add it here.** The trigger
  for a new entry is not "is this important" but "have we now said this twice". That keeps
  the guide grounded in real friction.

Related docs: the agent entry point is [AGENTS.md](AGENTS.md); the share-vs-separate
rules for UI live in [docs/component-strategy.md](docs/component-strategy.md); domain
language in [CONTEXT.md](CONTEXT.md); past decisions in [docs/adr](docs/adr).

### A note on LLM-generated code

Using LLMs is not discouraged here. But models are trained to produce working code, not
code that fits this codebase's conventions. Generated code is often terse, inconsistently
named, and unaware of the patterns below. Copy-pasting LLM output directly is an
antipattern: it shifts the review burden onto your colleagues. Treat generated code the
way you would treat code from an unfamiliar source: read it, understand it, and rewrite it
in the style here. The bar is the same whether or not an LLM wrote it.

## General principles

These apply regardless of layer.

### Clarity

Write code for the person reading it next, not the person writing it now. A solution that
is slightly longer but immediately understandable is almost always better than a compact
one that needs decoding.

Things that reduce clarity and should be avoided:

- **Nested ternaries.** A ternary is shorthand for a simple if/else, not an if / else if /
  else if chain. If a block has multiple conditions, `else if` blocks are easier to reason
  about.
- **Abbreviations in variable names.** Prefer full words: `conversation` not `conv`,
  `moderationStatus` not `modStatus`, `index` not `idx`. Widely understood initialisms
  (`url`, `id`, `api`, `html`) are fine. The exception is short closures where the
  abbreviation is clear from the variable it is tied to. Define domain jargon at first use.
- **Deep nesting.** Keep it shallow. Pull inner work into a well-named function past about
  four levels. Prefer guard clauses (early returns) over wrapping the body in an `if`.
  Handle the negative and error cases first so the success path reads as a straight run.

## JavaScript + Svelte + SvelteKit

The day-to-day working agreement for the apps. This is a **Svelte 5 runes** codebase.
Paths below are relative to the package you are working in
(`packages/civicos`, `packages/admin`, or `packages/shared`).

### Keep files small and single-purpose

Route files (`+page.svelte`) are **composition roots**, not dumping grounds. If a page
grows past ~300 lines it is a smell; past ~500 it is a bug in how it is split.

- **Presentation** goes in `.svelte` components. **Colocate by default:** a component used
  by a single route lives next to that route (e.g.
  `routes/contribute/VotingScreen.svelte`), matching the existing pattern. Promote to
  `src/lib/components/**` only once it is (or is clearly about to be) reused across routes.
  `@civicos/shared/ui/**` stays reserved for shadcn-svelte primitives.
- **Reactive state / orchestration** goes in a `.svelte.ts` runes module, colocated with
  its feature (see `packages/civicos/src/lib/services/polis-api.svelte.ts`).
- **Pure logic** (parse, format, match, transform) goes in a plain `.ts` under
  `src/lib/utils/**` with a colocated `*.test.ts`.

A `+page.svelte` should mostly wire these together and branch between screens.

### Data fetching lives in `load`, not in components

- **Fetch in `+page.ts` / `+layout.ts` (or the `.server.ts` variants), never in a
  component.** Components take data as props. This keeps `.svelte` files as composition
  and keeps loading testable and cache-aware. If a component is reaching out for data,
  that data should have arrived as a prop from a `load`.
- **Use the generated API client for anything served by the Comhairle backend.** The
  client is created once in the root `+layout.ts`:

    ```ts
    // src/routes/+layout.ts
    import { createApiClient } from '@crownshy/api-client/client';
    const api = createApiClient(url.origin + '/api', undefined, browser ? 'client' : 'server');
    return { api, region: data.region };
    ```

    Child loads read it from the parent and call typed methods, they do not construct
    their own:

    ```ts
    // src/routes/conversations/+page.ts
    export const load: PageLoad = async ({ parent }) => {
    	const { region, api } = await parent();
    	const events = await api.ListEvents({ params: { conversation_id: region.conversationId } });
    	return { events: events?.records ?? [] };
    };
    ```

- **Never hand-roll a `fetch` to the backend.** A bespoke `fetch('/api/...')` skips the
  generated types and the same-origin proxy contract. Raw `fetch` is legitimate only for
  things the client does not cover: the `/api/[...path]` proxy route itself (`+server.ts`),
  static assets (e.g. county geojson), and third-party services such as Polis. If you find
  yourself hand-rolling a backend call, that is the signal to use `api.*` instead.
- **Hoist shared fetches to the nearest shared layout.** When sibling pages need the same
  resource, load it once in the shared `+layout.ts` and read it via `await parent()` in
  the children, rather than fetching it in each page.
- **Declare `depends()` for targeted invalidation.** When a `load` produces data you will
  later want to refresh with `invalidate('key')`, give it an explicit `depends()` key
  rather than relying on URL-based invalidation. (Not yet universal in the codebase; add
  it as you touch loads that need it.)

### Forms: superforms + formsnap + zod

Do not hand-roll form state (`bind:value` plus ad-hoc validation). Build forms on the
shared primitives, which wrap `sveltekit-superforms` and `formsnap`:

- Define a `zod` schema, validate the form in the `load` with `superValidate`, and drive
  the client with `superForm`.
- Compose the markup from `@civicos/shared/ui/form` (`Form.Field`, `Form.Control`,
  `Form.Label`, `Form.FieldErrors`, `Form.Button`) rather than wiring inputs and error
  messages by hand.
- The schema is the single source of truth for both client and server validation. Do not
  duplicate validation logic outside it.

### Reuse before you build

Before hand-rolling UI or a helper, check what already exists in
`@civicos/shared/ui`, `@civicos/shared/utils`, and the package's own `src/lib`.

- Primitives (Button, Dialog, Input, Label, Badge, Card, Popover, Accordion, Command,
  Slider, ToggleGroup, Progress, Spinner, form) live in `@civicos/shared/ui/**`, built on
  **shadcn-svelte** over **`bits-ui`**. Do not re-roll one. If a primitive needs a new
  variant, extend the shared one (subject to the frozen-file rules in
  [docs/component-strategy.md](docs/component-strategy.md)), do not fork it into an app.
- Class merging goes through `cn()` from `@civicos/shared/utils` (re-exported as
  `$lib/utils` in civicos). Never concatenate class strings by hand.
- Icons come from `@lucide/svelte`. Do not inline bespoke SVGs for common glyphs.
- Charts use `layercake` (+ `d3-scale` / `d3-shape`); maps use `maplibre-gl`;
  drag-and-drop uses `svelte-dnd-action`. Reach for the existing dep before writing
  bespoke code. If you copy a block a second time, stop and extract it.

### Naming

- **Spell it out.** Full words for variables, functions, props, and types.
- **Name the props type; do not inline the annotation.** Declare a `type Props = { ... }`
  above the destructure and annotate with it:

    ```svelte
    <!-- WRONG: a big inline object literal buried in the destructure -->
    let { row, selected, onToggle }: { row: Foo; selected: boolean; onToggle: () => void } =
    	$props();

    <!-- RIGHT: a named Props type, destructure stays scannable -->
    type Props = { row: Foo; selected: boolean; onToggle: () => void };
    let { row, selected, onToggle }: Props = $props();
    ```

- **Derive types; do not restate them.** Prefer deriving a type from its source of truth
  over re-declaring a matching shape. To type a value you pass into a component, reach for
  `ComponentProps<typeof Component>['prop']` so a prop-type change surfaces as an error on
  the value, not as a vague props error down at the markup.

### Imports

- Cross-feature imports use the `$lib` alias (or the `@civicos/shared/*` entry points);
  colocated siblings use a plain relative path (`./Child.svelte`, `./state.svelte.ts`).
  Rule of thumb: crossing out of the current feature folder means `$lib` or a package
  entry; staying inside it means relative.
- Prefer the specific `@civicos/shared/*` export (e.g. `@civicos/shared/ui/button`,
  `@civicos/shared/utils`) over deep relative reaches into another package.

### Error handling

- In `load` functions, wrap the fetch in `try/catch` and degrade to a sensible empty
  shape rather than throwing an unstyled error, following the existing pattern:

    ```ts
    try {
    	const events = await api.ListEvents({ params: { conversation_id } });
    	return { events: events?.records ?? [] };
    } catch (e) {
    	console.error(e);
    	return { events: [] };
    }
    ```

- Prefer returning a typed result the page can branch on over letting an exception bubble
  into the SvelteKit error boundary, unless a hard error page is genuinely what you want.

### Comments

- Use **hoverable doc comments** (TSDoc, two-star `/** ... */`) on anything exported:
  functions, component props, non-obvious types. A single-star block comment does not
  surface on hover, so it reads as undocumented at the call site.
- **Comment the why, not the what.** A comment earns its place only when it carries
  something the reader cannot recover from the code: a non-obvious reason, a footgun, a
  constraint. Delete comments that restate the line.
    - Good: `// $derived (not $state + $effect) so SSR renders the real order too`.
    - Noise: `// derived value for the reordered steps` above the derived.
- No em dashes (or long dashes) in comments or prose. Use commas, parentheses, or a full
  stop.

### Styling

- **Tailwind v4 utilities, inline.** No custom classes in `<style>` blocks: if you need
  CSS, it is a utility. Complex keyframe / `@container` work is the rare exception and
  must be justified in a comment.
- **`text-body` (16px) is the floor for content.** Drop to `text-caption` (14px) only
  for secondary UI: table cells, sidebar nav, breadcrumbs, status badges. `text-label`
  (12px) is for metadata that is not read as content: divider labels, timestamps, user
  email. Never put content copy at 12px.
- **In `admin`, size text with the named scale, not raw `text-sm` / `text-2xl`.** The
  roles, their pixel values and the mobile pairings are documented at the top of
  `packages/admin/src/app.css`. Headings step down one rung under `md:`, so an H2 is
  `text-h3 md:text-h2`. Weight stays a separate utility, which is what lets the mobile
  rung reuse a smaller size without inheriting its weight.
- **Figma pixel values are not the type scale.** Read a mock for the *role* of each
  piece of text, then pick the token for that role. Do not transcribe its `font-size`.
  The mocks are drawn one to two rungs above the design system, which is exactly the
  drift [#396](https://github.com/crownshy/civic_os/pull/396) had to undo across the
  whole package. What that PR actually landed on:

  | Figma draws | It is really | Token |
  | --- | --- | --- |
  | 48px page title | H2 | `text-h3 md:text-h2` |
  | 36px card heading | H3 | `text-h4 md:text-h3` |
  | 36px field value (Title) | Body Large | `text-body-lg` |
  | 24px card subtitle | Body | `text-body` |
  | 24px field value (Slug) | Body | `text-body` |
  | 20px row in a list or table | Body | `text-body` |

  When a mock sits between two rungs, take the lower one. Sizes drift upward far more
  easily than down, and nobody files a bug about text being a rung too small.
- **`text-section` and `text-display` are deprecated.** They are aliases for `--text-h3`
  and `--text-h2`, kept only so existing call sites keep working. Never reach for them in
  new code; use the heading pair instead. Renaming the remaining call sites and deleting
  the aliases is open work.
- Use the **flat shadcn design tokens** (`bg-card`, `text-muted-foreground`, ...). Shared
  components reference **only semantic role tokens** (`--primary`, `--destructive`,
  `--muted`, `--border`, `--ring`, `--radius`), never a hex or an app-private token name.
  Colors differ per app, structure does not. The token model and the frozen-shared-file
  list are in [docs/component-strategy.md](docs/component-strategy.md).

### Motion and reduced motion

Honour `prefers-reduced-motion: reduce`, with judgement. Gate large motion (parallax,
scaling or panning a large object, long-distance travel); a brief opacity fade or a small
hover nudge usually does not need gating. When unsure whether a motion is large, gate it.

- CSS with Tailwind: add `motion-reduce:animate-none` to an `animate-*`; wrap hand-written
  keyframes in `@media (prefers-reduced-motion: reduce)`.
- JS-driven motion: branch on `matchMedia`, since the CSS variants do not reach it:

    ```ts
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    ```

- If code advances state off an `animationend` / `transitionend`, set the duration to
  near-zero (`0.001s`) instead of `animation: none`, so the event still fires.

### Svelte runes (runes only)

State is `$state` / `$derived` / `$props`, not Svelte 4 style. Do not write `export let`,
`$:` reactive statements, or `$$props` / `$$restProps`. If you see those in a file you are
editing, they are legacy, migrate them.

- **`$derived` is the default for computed state. `$effect` is a last resort.** If a value
  is a function of other state (props from `load` included), it is a `$derived`. Reserve
  `$effect` for true side effects that reach outside the reactive graph: DOM measurement,
  event listeners, subscriptions, logging, imperative third-party calls.
- **Never use `$effect` to keep one piece of state in sync with another.** This is the
  single most common runes mistake (and what LLMs emit by default). In Svelte 5 a
  `$derived` is writable: a local edit (a `bind:value` the user types into) overrides it
  until a dependency changes, then it resyncs on its own.

    ```svelte
    <!-- WRONG: state mirrored from a prop via an effect (stale value + extra render) -->
    let topicInput = $state(topic);
    $effect(() => { topicInput = topic; });

    <!-- RIGHT: a writable derived; bind:value still works, resyncs when topic changes -->
    let topicInput = $derived(topic);
    ```

- **Reach for `onMount` when setup runs once and does not track reactive state** (attach a
  `window` listener, kick off a one-shot init); return a cleanup function. Use `$effect`
  only when the setup must re-run as reactive state changes. If the body reads no reactive
  state, `onMount` states the intent more honestly than an `$effect` that never re-runs.
- Before writing a component, run it through the Svelte MCP `svelte-autofixer` (see
  [CLAUDE.md](CLAUDE.md)) until it returns no issues.

### Stories (Storybook)

Storybook is set up in `civicos` (`packages/civicos/.storybook`, addons for docs, a11y,
and vitest). Currently `admin` has none.

- **Colocate `*.stories.svelte` next to the component** it documents, matching the
  existing pattern (`src/lib/components/ui/VoteBar.stories.svelte`,
  `routes/contribute/VotingScreen.stories.svelte`).
- New shared or reused UI in `civicos` should ship a story. The a11y addon is on, so a
  story that flags accessibility violations is a bug to fix, not noise to ignore.
- Run Storybook with `pnpm --filter civic-os storybook`.

### Before you finish

- `pnpm -r check` (svelte-check) passes; the relevant package's `test:unit` passes.
- Format only the files you touched: `pnpm --filter civic-os exec prettier --write <files>`,
  not the repo-wide `pnpm format`. Run `pnpm --filter civic-os lint` (eslint) for civicos.
- No `: any` where a real type fits; no stray `console.*` left in (server-side
  `console.error` in a `load` catch is fine).
- **Do not `git commit`.** Leave changes for the human to review and commit.
