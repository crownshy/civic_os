Working doc of everything that needs an answer before the Insights surface (and the surrounding admin shell) feels finished. Each section explains **what we're doing today** so you shouldn't have to look at code.


## 1. Regions and how we resolve a conversation

### What we do today

The admin app does **not** ask comhairle "what conversations exist". It reads from a static TypeScript map at `packages/shared/src/data/regions.ts` plus an env overlay in `packages/admin/src/lib/config/regions.ts` for the synthetic `dev` region (driven by `PUBLIC_DEV_*` env vars).

Each `RegionConfig` carries, among other things:

- `slug`: the URL segment (`/c/dev`, `/c/oregon`, ...)
- `conversationId`: comhairle's `Conversation` UUID
- `polisId`: the Polis conversation id
- `polis_workflow_step_id`: the workflow step that wraps the Polis tool

From the URL `/c/:slug` we look up the region, and from the region we pull `conversationId` / `polis_workflow_step_id` to drive every downstream call:

- Events list: `api.ListEvents({ params: { conversation_id } })`
- Insights: `api.axios.get('/tools/polis/report_data', { params: { workflow_step_id } })`

This is captured as "Open problem #1" in `CONTEXT.md`.

### Questions

- **Q1.1** Should the admin sidebar's conversation list eventually come from comhairle (`GET /conversation` or similar) instead of `regions.ts`? If yes, what happens to the dev region overlay: keep it client-side, or have comhairle seed a dev conversation?
- **Q1.2** Does a Host (Organization) own one Conversation or many? `regions.ts` assumes 1:1; the design implies many. This decides whether a "Region" sits above or beside Conversation in the sidebar.
- **Q1.3** Are `polisId` and `polis_workflow_step_id` ever going to live on comhairle's `Conversation` model (or a `polis_conversations` join), or permanently in `regions.ts`?
- **Q1.4** When we ship a new region, who owns the migration off `regions.ts`? Same person who creates the comhairle conversation? Different team?

---

## 2. Authentication / session flow

### What we do today

1. User hits `/login` and enters email + password.
2. SvelteKit form action posts to `comhairle /api/auth/login`.
3. Comhairle responds with an `auth-token` cookie.
4. `hooks.server.ts` runs on every non-public request: pulls `auth-token`, probes `GET /regions` to confirm admin role, sets `locals.isAdmin = true`.
5. Server-side fetches forward the cookie via the api-client interceptor in `@crownshy/api-client/client.ts`.
6. Client-side fetches go through SvelteKit's `/api/[...path]` proxy (`packages/admin/src/routes/api/[...path]/+server.ts`) which appends `API_PREFIX` and forwards cookies.

### Questions

- **Q2.1** Is this okay or should I remove it/change it to something else? Ideas?

---

## 3. People count in the Themes card

### What we do today

The new Themes card design shows "**N claims by M people**" per theme. We render claims (= statement count for the theme). We render people as the literal string `"X"` with a TODO comment because **the data isn't in `/tools/polis/report_data`**.

The current payload gives us:
- `comments[].overall_votes`: aggregate `{ agrees, disagrees, passes }`
- `comments[].group_votes[]`: same aggregate per group
- `participants[]`: `{ pid, group_id, pca_position }` but **no per-vote participant ids**

So we can count *votes* on a theme's statements, but we can't say *unique people who voted on any statement in this theme*. That requires per-vote participant data, i.e. a join table of `(comment_id, pid, vote_type)`.

### Questions

- **Q3.1** Is "people who voted on any statement in the theme" the metric we actually want? Or is it "people whose own statement was tagged with the theme" (= submitters), which we *can* compute if comhairle ever returns `submitter_pid` on `comments[]`?
- **Q3.2** Is exposing per-vote pid data acceptable privacy-wise? Polis's Math API returns `votes-base.json` with `(pid, tid, vote, weight)` rows, and comhairle could surface that, but it lets us correlate one person's votes across statements.
- **Q3.3** If per-vote data is off-limits, would we accept a privacy-safe approximation: comhairle returns `unique_voters_per_theme` precomputed on the backend, with no individual mapping exposed?
- **Q3.4** Until we have a real number, what string do we want in the UI? `"X people"`, `"— people"`, hide the line entirely, or show `"≥ N people"` using `max(total_votes_on_any_statement_in_theme)` as a floor?

---

## 4. Controversy thresholds

### What we do today

We coined the term "Controversy" (right? or is this coming from somewhere?). For each theme we:

1. Take every statement tagged with the theme.
2. For each statement, compute `max(agree%) - min(agree%)` across opinion groups ("spread").
3. Average those spreads across the statements.
4. Bucket: `< 15` is low, `15-30` is moderate, `> 30` is high.

Implemented in `packages/admin/src/lib/utils/report.ts` as `themeControversy`.

### Questions

- **Q4.1** Are the boundaries (15 / 30) the right ones? Should we calibrate them against a real conversation that's already been hand-labelled?
- **Q4.2** Should controversy be weighted by **how many people voted** on each statement? Today a 1-vote statement contributes the same as a 100-vote one.
- **Q4.3** Should there be a **minimum statement count** before we classify a theme? A theme with one statement isn't really "high controversy" even if that statement is divisive.
- **Q4.4** Same question as Q4.2 but for "passes": a theme where half the votes are passes is *uncertain*, not *controversial*. Should it short-circuit to "low controversy" with an "uncertain" badge instead?
- **Q4.5** Do facilitators want to override the classification per theme (manual high/mod/low)? If yes, we need a place to persist that, either in comhairle or local.

---

## 5. Areas of Consensus / Difference / Uncertainty thresholds

### What we do today

Hard-coded in `packages/admin/src/lib/utils/report.ts`:

- **Consensus**: every group >= 80% agree, min 5 votes per statement.
- **Difference**: between-group agree spread >= 30%, min 5 votes.
- **Uncertainty**: pass% >= max(avg + 1 stdev, 30%), min 5 votes.

### Questions

- **Q5.1** Are 80% / 30% / 30% the right thresholds, or should they live in a config that facilitators can tune per conversation?
- **Q5.2** `minVotes = 5`: appropriate for a small conversation? For a conversation with 10k voters this floor is laughably low.
- **Q5.3** Should "Uncertainty" use absolute thresholds, percentile thresholds, or both? Today it's hybrid (avg+stdev OR 30%).
- **Q5.4** Should any of these sections support "show more" / pagination? Today we render all matches.

---

## 6. T3C ("Talk to the City") integration

### What we do today

Nothing. We parked it. The page reads `comment.topics?: string[]` from Polis NLP when present, otherwise themes are empty. The design's subtopic links and AI-generated theme summaries are not rendered.

### Questions

- **Q6.1** Is T3C actually in scope for this milestone, or a future one?
- **Q6.2** Where would T3C output live? Options: a new comhairle endpoint (e.g. `GET /tools/t3c/report_data?conversation_id=...`), a JSON blob uploaded to comhairle and stored on `Conversation`, or a separate service the admin app calls directly.
- **Q6.3** Who runs T3C, and how often? On-demand by a facilitator? Nightly batch?
- **Q6.4** Does T3C *replace* `comment.topics` (Polis NLP), or *augment* it (Polis = quick & dirty, T3C = curated)? If both, who wins when they disagree?
- **Q6.5** "Subtopics" in the design: are these T3C's `subtopics`, or our own per-theme tags? What's the cardinality (always 3? variable?).
- **Q6.6** Goals — moved to its own section, see Section 9.

---

## 7. The api-client situation

### What we do today

`@crownshy/api-client` is a generated Zodios client. `+layout.ts` builds an instance with `createApiClient(url.origin + '/api', ...)` and we consume it as `data.api` in child `+page.ts` loads.

It works for `ListEvents` and `GetEvent`. It **does not** work for `PolisGetReportData` because the response is declared as `z.void()` in `api.ts`, and Zodios throws when it validates the real object payload against `void`.  Worked around this in `insights/+page.ts` by going through the underlying `api.axios` and casting to our local `PolisReportData` type.

### Questions

- **Q7.1** Have I missed something? I'll need some help with this.

---

## 8. Insights surface -- UX

### What we do today

A single scrollable page with top stats, Themes card, Consensus, Difference, Uncertainty, and Theme Explorer. Filter toggles for "Exclude passes" and "Exclude host statements" are local to each section.

### Questions

- **Q8.1** Should the filters be **global** (one set at the top, applies everywhere)? Today every section has its own state.
- **Q8.2** "Exclude host statements" default state: the design implies ON by default to match the public report. Today it's OFF in our component. Which?
- **Q8.3** Do we need an export: CSV of statements, or a printable PDF of the report?
- **Q8.4** Real-time: should the page refetch / poll while a conversation is live, or one-shot at navigation?

---

## 9. Participation goals (recruitment targets)

### What we do today

The Participants tab shows recruitment **goals** at two levels:

1. **A top-line total participants goal** ("GOAL 700" beside "TOTAL PARTICIPANTS 514"). Today this is **hardcoded** in `participants/+page.svelte`:
   ```ts
   // TODO: pipe a real goal from RegionConfig once exposed.
   const participantsGoal = 700;
   ```
2. **Per-bucket goals** inside each demographic table (Geography county, Race/Ethnicity, Gender, Political Affiliation, Age). `DemographicTable.svelte` already accepts an optional `goal?: number` per row, renders a `GOAL` column, a `% TO GOAL` column, and overlays a goal marker on the progress bar. But **no row is actually given a goal value today** — the rows we pass in are `{ label, count }` only.

So the UI plumbing exists end-to-end, but:
- The numeric goal targets live nowhere — not in comhairle, not in `regions.ts`, not in admin app state.
- The design shows a "Modify Goals" button per section, but there is no edit UI and no endpoint to persist edits to.
- Even the demographic *categories themselves* (which counties? which gender buckets? which race labels?) come from whatever the participation form happened to record — there is no curated list a host could set goals against.

### Questions

- **Q9.1**  Where do we store it? 