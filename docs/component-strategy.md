# Component & theming strategy

_How `admin`, `civicos`, and `shared` should divide up UI — so we stop re-solving
the same button/color problem in two places._

## TL;DR

- **Colors differ per app; component *structure* should not.** The way to get
  "same component, different look" is: shared components reference **semantic
  role tokens** (`--primary`, `--destructive`, `--muted`…) and never hardcode a
  hex or an app-specific token name. Each app supplies the values.
- **Good news:** the token layer is *already* compatible — both apps define
  `--primary`, `--destructive`, etc. The divergence is only at the **component
  layer**, where `civicos` re-implements primitives (its own `Button`, `Card`,
  `ProgressBar`…) instead of using `shared/ui`.
- **Don't unify everything.** Share the ~12 generic primitives; keep the domain
  components (tables vs carousels) per-app. Migrate `civicos` onto shared
  primitives one at a time, lowest-risk first, Button last (its API needs a
  design decision).

## Current state

| Package | Role | UI source |
|---|---|---|
| `shared/ui` | primitive kit (shadcn-svelte) | **only `admin` uses it** |
| `admin` | dashboards, tables, moderation | consumes `shared/ui` |
| `civicos` | public voting app | **its own `ui/`** — parallel Button, Card, ProgressBar, Accordion, Header… |

Three theme files: `shared/styles/theme.css` (base), `admin/app.css` (neutral
surface + accent roles), `civicos/lib/styles/theme.css` (warm cream).

## The token model (source of truth: `admin/src/app.css`)

Admin's accent palette carries all the meaning because its surface is neutral.
Three roles — keep them straight:

| Role | Admin value | Meaning |
|---|---|---|
| `--primary` | `#c96442` terracotta | interactive / brand: buttons, links, active nav & tabs, selected chips |
| `--success` | `#406b43` green | positive status: LIVE, accept, processed / done / confirmed |
| `--destructive` | `#ee503b` coral | remove / reject / delete / error |

Plus `--primary-subtle` / `-hover` (idle chip tints), the data-viz channels
(`--consensus`, `--difference`, `--meter-*`, `--ring-track`), and `--host` (the
blue "You" badge).

> **Why `--success` exists:** upstream `theme.css` ships `--primary` *as* the
> civic green. Admin repurposes green to its honest role (`--success`) and makes
> terracotta the real `--primary`. That's what lets `shared/ui` Button stay on
> plain `bg-primary` — the value differs per app, the role doesn't.

`civicos` keeps `--primary` = green; it has no `--success` yet. **If a *shared*
component ever needs "success", both apps must define `--success`.**

## What to SHARE (unify onto `shared/ui`)

Generic, behavior-driven, theme-agnostic primitives:

`Button` · `Card` · `Input` · `Label` · `Badge` · `Link` · `Progress` ·
`Spinner` · `Dialog` · `Popover` · `Accordion` · `Command` · `Slider` ·
`ToggleGroup` · `form/*` · `MonoLabel`

## What to KEEP SEPARATE (domain components — they *should* differ)

- **admin:** `DemographicTable`, `StatementRow/Section`, `ThemeChip/Bar/Picker`,
  `GroupCircle`, `ColumnFilterHeader`, `PollStatRow`, `RowAccentStripe`,
  `transcript-viewer/*`
- **civicos:** `SwipeCarousel`, `ConfettiOverlay`, `FloatingStatement`,
  `DonutChart`, `VoteBar`, `EmojiCircle`, `GradientCard`, `QuoteText`,
  `PopQuiz`, `ComposeOverlay`, `ReportPanel`, `Header`, `StickyNav`, `AlertBanner`

## ⚠️ Constraint: civicos stays frozen

**Decision (current):** do not modify `civicos` at all. That means the
"move civicos onto shared" migration below is **PARKED** — steps 2–4 are the
plan *if we ever opt in*, not work to do now. Until then:

> **Scope.** Read literally this blocks milestones 12 and 13, so two ADRs narrow
> it: [0003](adr/0003-civicos-freeze-covers-components-not-data.md) carves out
> `civicos` data loading, and
> [0005](adr/0005-host-copy-is-sanitized-where-it-renders.md) carves out security
> fixes at existing render sites. What stays frozen is the shared primitives
> listed below and the parked migration.

- The safe cleanup (token hygiene + admin's Button) is **already done**.
- `shared/ui/button` is effectively **admin-only** — change it freely.
- These shared files **are imported by civicos** — treat as frozen; only make
  token-driven changes (which can't cross apps) and never alter their markup
  without checking civicos too:
  `Card` · `Badge` · `Link` · `MonoLabel` · `input` · `popover` · `form` ·
  `carousel` · `command` · `spinner`

## Migration order (civicos → shared) — PARKED; one PR each, verify visually

1. **✅ Token hygiene (done).** Semantic roles only; no hardcoded hex or
   app-specific names in shared components. `admin` primary/success/destructive
   split landed; shared `Button` reverted to `bg-primary`. Guardrail verified
   clean.
2. **Low-risk dupes:** `Input`, `Label`, `Card`, `Badge`, `ProgressBar → Progress`.
   Near-identical markup; just wire civicos's tokens.
3. **Overlays:** `Dialog`, `Popover` (if civicos has ad-hoc versions).
4. **`Button` — LAST, needs a design decision.** civicos's Button has a *richer*
   API (`primary｜secondary｜destructive｜outline｜pill｜soft｜ghost｜gradient`,
   sizes `xs–lg`) than shared's (`default｜destructive｜outline｜secondary｜ghost｜
   link`, sizes `default/sm/lg/icon`). Unifying = pick ONE superset API, then
   migrate both apps. Highest value, but don't start until the variant
   vocabulary is agreed.
5. **Never** migrate the domain components above.

## Guardrails (keep it from diverging again)

- Shared components reference **only** role tokens: `--primary`, `--secondary`,
  `--destructive`, `--muted`, `--accent`, `--border`, `--ring`, `--radius`.
  **No hex. No `--brand`/`--success`/other app-private names.**
- Quick check for violations (6-digit hex + arbitrary color classes; avoids
  `{#each}` false positives). **Verified clean as of this pass.**
  ```sh
  grep -rnE "#[0-9a-fA-F]{6}\b|bg-\[#|text-\[#|border-\[#" packages/shared/src/ui
  ```
- New shared primitive? It must render acceptably in *both* apps before it
  lands. If it needs a token neither app defines, define it in both first.
