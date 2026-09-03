# AGENTS.md

Entry point for LLM agents (and a decent orientation for humans too). This file is
intentionally thin: it points at the canonical docs and lists the few things you must not
get wrong. **Read the linked docs before writing code.**

## What this repo is

Civic OS is the SvelteKit frontend for a civic participation platform. It talks to
**Comhairle** (a separate Rust backend) for users, invites, and conversation data, and
embeds **Polis** for the actual voting. See [README.md](README.md) for how requests flow
and [QUICKSTART.md](QUICKSTART.md) for local setup. Domain language lives in
[CONTEXT.md](CONTEXT.md).

This is a **pnpm workspace**; there is no backend code here. Layout (`packages/*`):

- `packages/civicos/` (package `civic-os`) the public participant app: swipe voting,
  contribute flow, reports. Storybook lives here.
- `packages/admin/` (package `@civicos/admin`) the admin app: dashboards, tables,
  moderation, transcript viewer. Consumes `@civicos/shared`.
- `packages/shared/` (package `@civicos/shared`) the shared kit: shadcn-svelte UI
  primitives (`ui/**`), design tokens (`styles/theme.css`), region/zip data, and
  `cn()` + shared types under `utils.ts`.

The two apps intentionally diverge at the theme and domain-component layer while sharing
generic primitives. The full rules for what to share vs keep separate are in
[docs/component-strategy.md](docs/component-strategy.md); read it before touching
`packages/shared/src/ui`.

## Read these before you work

- **[STYLE_GUIDE.md](STYLE_GUIDE.md)** how we build the frontend: general principles plus
  the full Svelte/SvelteKit working agreement (data fetching, forms, styling, runes).
- **[docs/component-strategy.md](docs/component-strategy.md)** what belongs in `shared`
  vs each app, the token model, and which shared files are frozen because `civicos`
  imports them.
- **[CONTEXT.md](CONTEXT.md)** domain language (Region, County, Conversation, goal
  metrics). Use these terms exactly; they are load bearing.
- **[docs/adr/](docs/adr)** architectural decisions and their rationale. Check here
  before reversing a design choice.
- **[docs/regions-migration.md](docs/regions-migration.md)** which `regions.ts` fields
  survive the move to Host configuration and where they go. Check before adding a field
  to `regions.ts` or wiring one to the backend.

## Commands

Run per-package from `packages/<name>`, or use the root scripts:

- `pnpm dev` civicos dev server. `pnpm dev:admin` admin dev server.
- `pnpm -r build` / `pnpm run build` build every package.
- `pnpm -r check` / `pnpm run check` svelte-check (types) across packages. `civicos`
  has a floor of two errors it cannot fix: `@crownshy/api-client` exports raw `.ts`
  source generated against zod 3, and under the workspace's zod 4 its two one-arg
  `z.record()` calls no longer type. Runtime is unaffected (zod 4 still accepts that
  form and validates values), `skipLibCheck` does not reach a dependency's source, and
  tsconfig `exclude` does not stop TS diagnosing an imported file. It goes when
  api-client is regenerated against zod 4. Anything above two is yours.
- `pnpm --filter civic-os lint` / `pnpm --filter @civicos/admin lint` prettier check +
  eslint. `pnpm run lint` runs both. Both packages are currently red against a backlog of
  pre-existing violations (see Follow-ups below), so read the diff, not just the exit code.
- `pnpm --filter civic-os test:unit` / `pnpm --filter @civicos/admin test:unit` Vitest.
- `pnpm --filter civic-os storybook` (port 6006) / `pnpm --filter @civicos/admin storybook`
  (port 6007) run Storybook.
- Format only files you touched:
  `pnpm --filter <pkg> exec prettier --write <files>`. **Do not** run the repo-wide
  `pnpm format`; it reformats unrelated files and buries your diff.

## Non-negotiables

The short list. Full rationale for each is in [STYLE_GUIDE.md](STYLE_GUIDE.md).

- **Do not `git commit`.** Leave changes for the human to review and commit.
- **Backend data goes through the generated API client, never a hand-rolled `fetch`.**
  Use `createApiClient` from `@crownshy/api-client/client` (created once in the root
  `+layout.ts`, read in child loads via `await parent()`), e.g. `api.ListEvents(...)`.
  Raw `fetch` is allowed only for things the client does not cover: the
  `/api/[...path]` proxy route itself, static assets, and third-party services (Polis).
- **Fetch in `load`, not in components.** Data loading belongs in `+page.ts` /
  `+layout.ts` (or `.server.ts`); components take data as props. This keeps `.svelte`
  files as composition, not I/O.
- **Forms validate through superforms.** Build forms with the shared `@civicos/shared/ui/form`
  primitives (formsnap + `sveltekit-superforms` + `zod`), not hand-rolled `bind:value`
  state and ad-hoc checks.
- **Reuse the shared kit before building UI.** Primitives live in `@civicos/shared/ui/**`
  (shadcn-svelte on `bits-ui`). Do not re-roll a Button, Dialog, Input, etc.
- **Svelte 5 runes only** (`$state` / `$derived` / `$props`). No `export let`, `$:`,
  `$$props`. Never use `$effect` to mirror one piece of state from another; a writable
  `$derived` is the fix.
- **Colocate by default.** Route-local components (and their `*.stories.svelte`) live
  next to the route; promote to `src/lib/components/**` only when reused. Shared
  primitives are `@civicos/shared/ui/**` only.
- **`text-body` (16px) is the floor** for content text. Tailwind utilities inline, flat
  shadcn tokens (`bg-card`, `text-muted-foreground`), semantic role tokens only in
  `shared`.
- **Size text by role, never by the Figma's pixel value.** In `admin` use the named
  scale (`text-h4 md:text-h3`, `text-body-lg`, `text-body`, `text-caption`, `text-label`)
  defined at the top of `packages/admin/src/app.css`; no raw `text-sm` / `text-2xl`, and
  no `text-section` / `text-display` (deprecated aliases). Mocks are drawn one to two
  rungs above the scale, so transcribing their sizes reintroduces the drift #396 fixed.
  Translation table in [STYLE_GUIDE.md](STYLE_GUIDE.md).
- **No em dashes** anywhere in code or prose. Use commas, colons, parentheses, or split
  the sentence.
- Before finishing: `check` passes, relevant `test:unit` passes, no `: any` where a real
  type fits, no stray `console.*`.

## Keeping these docs current

When the same review feedback comes up a **second** time, add it to
[STYLE_GUIDE.md](STYLE_GUIDE.md). When a decision reverses or introduces a non-obvious
constraint, write an ADR in [docs/adr/](docs/adr). When a domain term gets coined or
redefined, update [CONTEXT.md](CONTEXT.md). This repo is evolving fast: if you touch a
file whose surrounding doc has gone stale, trim the stale part in the same pass rather
than letting it rot.

## Follow-ups (known debt, not yet done)

These are real gaps noticed while writing these docs. Fix opportunistically or spin out a
focused PR; do not let them silently grow:

- `sveltekit-superforms` + `formsnap` are installed and the shared `ui/form` primitives
  exist, but app forms do not use them yet. Migrate forms onto superforms as you touch
  them.
- Both packages have lint configured but neither passes yet: `admin` has 73 files failing
  `prettier --check` and 52 eslint errors. `civicos` is clean on `prettier` and down to 37
  eslint errors, all of them decisions rather than cleanups: 14 `no-at-html-tags` (#409),
  14 `no-navigation-without-resolve`, one `no-explicit-any`, and 8 `no-unused-vars` that
  are each the visible half of a filed bug (#410, #411, #412, #413), a dead county map
  #423 will want, or a countdown whose markup is commented out. Read the reason before
  deleting the symptom. Pay them down in focused PRs rather than mixing fixes into
  feature work.
- `load` functions do not call `depends()` for explicit invalidation keys. Add them when
  you touch a `load` that needs targeted invalidation.
