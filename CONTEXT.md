# Things i would need help with


### Region
A geographic deployment scope (e.g. Utah, Oregon) with its own subdomain
(`utah.bloomproject.us`), zip-code prefixes, and a coalition of hosting Organizations.

Today, regions exist only as a static TS map in `packages/shared/src/data/regions.ts`
plus a `Vec<Uuid>` field on `Organization` in comhairle. There is no `Region` table
or model behind the ids — see [Open problem #1](#open-problem-1--regionconversationhost-data-model).

### Conversation
A single Polis-style deliberation. Owned by comhairle (`Conversation` model:
`id`, `title`, `description`, `slug`, `faqs`, `is_live`, `organization_id`, …).
Each Conversation maps to exactly one Polis conversation via `polisId`.

A Region may eventually own *many* Conversations (design implies this);
today the `regions.ts` map encodes one Conversation per Region.

### Host
The lead Organization for a Region's Conversation. Modeled in comhairle as
`Organization` (`name`, `external_url`, `org_type`, `regions: Vec<Uuid>`).
`hostName` / `hostUrl` in `regions.ts` are duplicates of this.

### Partner
A coalition Organization that contributes to a Region's Conversation but is not
the Host (?is this correct). Same `Organization` model in comhairle.

### Polis conversation
The external Polis-side artifact identified by `polisId`. The `polis_workflow_step_id`
links a comhairle workflow step to a Polis conversation.

### Dev region
A synthetic Region built at runtime from `PUBLIC_DEV_*` env vars, so a local
checkout can target a locally-seeded conversation. Implemented in both `civicos`
and `admin` via the same overlay pattern; the same env var names work for both apps.

### Theme
A topic tag attached to a statement, surfaced by the report payload as
`comment.topics?: string[]`. A future Talk-to-the-City (T3C) integration to be integrated.

### Controversy
A coined classification for a Theme — `low | moderate | high` — derived from
the average per-statement group-agree spread across statements tagged with
that theme. Spread for a statement = `max(agree%) − min(agree%)` across
groups. (Assumptions, let's confirm) Buckets: `<15` low, `15–30` moderate, `>30` high. Defined and tunable in `packages/admin/src/lib/utils/report.ts`. Not a Polis or T3C concept — it's our own roll-up for the Insights dashboard? 

### Events
Upcoming live conversations (in-person or online) attached to a Region. Today
embedded in `regions.ts` as `ConversationEvent[]`; partially modeled in comhairle
via workflow steps and the `event_id` migration.

---

## Open problem #1 — Region/Conversation/Host data model

The current `RegionConfig` shape in `packages/shared/src/data/regions.ts` mixes
four concerns. Bucketing each field against what comhairle already stores:

### A. Already covered by comhairle (delete-once-migrated)
- `conversationId`, `inviteId`, `slug` (per conversation), `question`, `faq`,
  `aboutConversation`, `events`, `hostName`, `hostUrl`, `partners[]`

### B. Polis bridge
- `polisId`, `polis_workflow_step_id`

### C. Region-level fields with no model behind them
- `stateName`, `demonym`, `zipPrefixes[]`, `shareUrl`, `hostsBlurb`,
  `phaseLabels`, `conversationsActive`

Comhairle has `Organization.regions: Vec<Uuid>` but no `Region` table. Adding
one would let bucket C live in comhairle.

### D. Pure presentation copy
- `heroHeader`, `heroBlurb`, `contextParagraphs[]`, `hostMessage[]`,
  `campaignPageDescription`, `campaignPageHosts`, `whatsNext`, `goDeeper`,
  `endCtaJoinDescription`, `endCtaShareDescription`, `fullHosts`

These don't model anything domain-level — they're landing-page copy tied to a
specific render. Don't fit comhairle's data model and shouldn't.

### Open questions
1. Does a Host own many Conversations? (Admin design suggests yes; `regions.ts`
   assumes one.)
2. Are C and D one store or two? Potential split: C as proper comhairle tables
   (`regions`, `polis_conversations`); D as a separate marketing/CMS-shaped
   `region_content` store. Premature until we know who edits D content.
3. Does the extra-data store key off `conversation_id` or `region_slug`?
   Depends on (1).
4. Migration story — staging convos already live in
   `comhairle.bloomproject.us`; how do existing prod regions move off
   `regions.ts` without breaking Utah / Oregon / generic?

---

## Conventions in play (Let's confirm if okay, bc I'm not sure)

- **Shared package is framework-agnostic.** `@civicos/shared` must not import
  from `$env/...` or any SvelteKit-only API. Env-driven overlays happen at the
  consumer boundary (each app's `lib/config/regions.ts`).
- **Same `PUBLIC_DEV_*` env var names across apps.** One `.env` works for both
  `civicos` and `admin` locally. Differentiating dev convos per app is not
  worth the friction.
- **Admin API requests go via `/api/[...path]` proxy.** `API_URL` + `API_PREFIX`
  env vars target the right backend per environment
  (`localhost:3000` in dev, `comhairle.bloomproject.us/api` in prod).
