# Things i would need help with


### Region
A geographic deployment scope owned by comhairle (`RegionDto`: `id`, `name`,
`description`, `region_type` of `custom | official`, `official_id?`, `metadata?`),
reachable via the client's Region CRUD (`ListRegions`, `CreateRegion`,
`GetRegion`, ...). It is the model behind a **Place**.

A Region **has many Areas**, and an Area may belong to many Regions:
`GetRegionAreaLinks`, `SetRegionAreaLinks`, `AddRegionAreaLink`,
`RemoveRegionAreaLink` on `/regions/:id/areas`. This many-to-many is already in
the API and the frontend does not use any of it yet.

Three things still block a Region from backing a Place directly (ADR 0006):
it has **no URL-safe slug**, **nothing links a Conversation to it**, and
`/regions` and `/region_areas` are **401 to an anonymous caller**, which is
every participant. So a Place still rides on `Conversation.metadata`.

_Note_: `RegionDto.name` and `.description` come through the generated client
typed `z.string().uuid()`. That is a localisation reference leaking into the
OpenAPI spec, not the real shape. Do not build on those types until the spec is
fixed.

_Avoid_: using "Region" in product copy. The user-facing word is **Place**.

### Place
**A name for discovery, covering one or more Areas.** "Utah", "Central Oregon",
"Tayside". A Place is how a participant finds something: `/<place-slug>` is a
page listing what is running across that Place's Areas. It is not where a
Campaign runs; that is the Area.

`Place -> Areas` is many-to-many in both directions. A Place covers several
Areas, and one Area can sit under several Places (Deschutes County is in both
"Oregon" and "Central Oregon"). Modelled in comhairle as `Region` plus the
`region_areas` links.

**A Place is derived, not assigned.** A Campaign is attached to Areas; the Place
pages it appears on are whichever Places cover any of those Areas. So a Campaign
spanning Areas in two Places is listed on both, and nobody has to pick one.

**Not yet true in the code.** What ships today is one Place per Campaign, stored
as `{ slug, name }` on `Conversation.metadata.place`, with no Areas anywhere
(ADR 0006, ADR 0008). The model above is the agreed direction, waiting on a
Conversation-to-Area link in comhairle. See the Place & Area tab of the team doc
for the interim mock.

### Area
**The actual geography a Campaign runs in.** A Campaign is attached to one or
more Areas, and that attachment is what makes it real in a location. Where a
**Place** is a name people browse by, an Area is a place on the ground.

Finer-grained than a zip code is the intent. The exact unit and representation
are **not settled**: comhairle's `RegionAreaDto` is `{ id, createdAt, zipPrefix }`
today, which is coarser than a zip, not finer. Treat the current DTO as a
placeholder for the concept, not as the concept.

**The consequence nobody has solved yet.** A participant only ever gives us a
**zip code** (at JOIN, saved to their profile). If an Area is finer than a zip,
then a zip cannot resolve to one Area, only to the set of Areas it touches, and
that set can span several Campaigns. Every "forward them by zip" idea runs into
this. It is an open question, not a decided design.

**Term collision, beware.** The Insights dashboard already has **Area of
Consensus**, **Area of Difference** and **Area of Uncertainty**, which are
classifications of a *statement* and have nothing to do with geography. When
"Area" appears unqualified in this glossary it means the geographic unit. The
Insights senses are always spelled out in full. Whether one of the two should be
renamed is open.

### County
The geographic unit the participants **Geography** table groups by (rows are
counties, not zip codes). Derived by rolling a respondent's zip code up to its
county via the national zip-to-county lookup (`ZIP_LOOKUP` in
`packages/civicos/src/lib/data/zipcodes.ts`). A County is also a **goal bucket**:
Geography is a recruitment-target metric named `county`, so each county carries a
target ("floor") and a "to goal" percentage, exactly like the demographic tables.

A county's set is scoped today by the legacy region's `zipPrefixes` (Oregon `97`,
Utah `84`). Under the Place/Area model that scoping is the Campaign's **Areas**,
which is also what would finally give a Campaign created in admin a county set at
all; it currently has none, because only Utah and Oregon have `zipPrefixes`.

**A County is not an Area.** County is a reporting bucket we roll up to, fixed by
a national lookup. An Area is what a Campaign is attached to, chosen by a Host.
They may often coincide and they are not the same thing.

_Avoid_: Subregion (see below), Zip code.
_Note_: `getCountyFromZip()` in `session.svelte.ts` is a **misnomer**: it returns
the region's `stateName`, not a county. Real county resolution is
`ZIP_LOOKUP.get(zip).county`.

### Subregion
A named community *finer* than a County (Bend, Redmond, Sisters, all in Deschutes
County), used in the source recruitment spreadsheets.

**This is probably what an Area is.** The concept was recorded here as
deliberately not modelled, on the grounds that the Geography table shows Counties.
"Finer than a zip code" is the same granularity Subregion describes, so if Area
lands at that level, Subregion is its retired alias rather than a separate idea.
Confirm before using both words in one sentence.

### Geography (participants table)
The first card on the participants page. Groups respondents by **County** with
`Count`, `% of total` (share of respondents who gave a zip), `Goal`, and `To goal`
columns plus a map. Rows shown = counties with participants ∪ counties with a goal
set; out-of-region or unrecognized zips fold into a single "Other / Unknown" row.

### Demographics export
A CSV of **raw per-participant profile rows** — `User ID, Ethnicity, Age, Gender,
Zipcode, Political Party, Profile Created At` — downloaded from the participants
page. Distinct from the page's **demographic tables** (Geography, Ethnicity,
Gender, Political, Age), which show *aggregated* count-vs-goal per bucket; the
export is the underlying individual records. Only **consented** participants are
included — a narrower set than `totalParticipants`, which counts participation
regardless of profile consent. Sourced from comhairle
`GET /conversation/{id}/demographics/export`, which is **owner-only**
(`conversation.owner_id == caller`) and **not** workflow-scoped.

### Participant Ask
One of the four things civicos asks an Open Poll participant for besides their
votes: **Add a Statement**, **Collect Email**, **Ask for Feedback**, **Share with
Friends**. Each Ask surfaces on two screens, and the Host has one switch that
governs both:

1. Mid-poll, as a `CheckpointScreen` variant, shown at every tenth vote
   (`packages/civicos/src/routes/contribute/+page.svelte`).
2. On the end page, as a `ThankYouScreen` CTA card.

The two surfaces already share one completion flag per Ask
(`session.emailProvided`, `endCtaShareCompleted`, `endCtaReviewCompleted`), so
they are the same Ask shown twice, not two features. The mid-poll checkpoint
skips an Ask whose flag is set; the end-page card does not, it dims and shows a
checkmark. `Add a Statement` has no end-page card (composing lives in the vote
bar), and the end page's "Join a Conversation." card is not an Ask and has no
switch.

_Avoid_: "checkpoint" for the Ask itself. A **Checkpoint** is the mid-poll screen,
one of the two places an Ask appears. Host-facing UI says Ask.

Toggles live in `conversation.metadata.participantAsks` (interim storage, same as
demographics). The definition and the readers are
`packages/shared/src/data/participant-asks.ts`: admin writes the switches on
Setup, civicos derives its checkpoint order and its end-page cards from them.

### Conversation
A single Polis-style deliberation. Owned by comhairle (`Conversation` model:
`id`, `title`, `description`, `slug`, `faqs`, `is_live`, `organization_id`, …).
Each Conversation maps to exactly one Polis conversation via `polisId`.

A Region may eventually own *many* Conversations (design implies this);
today the `regions.ts` map encodes one Conversation per Region.

### Campaign
Product-facing name for a **Conversation** (the word participants and hosts see;
"conversation" is the comhairle-internal term). Same `Conversation` model. Use
"Campaign" in host/admin-facing copy, "Conversation" when talking about the
comhairle model. `Campaign ↔ Conversation` mirrors `Host ↔ Organization` and
`Place ↔ Region`.

**A Campaign is attached to one or more Areas, and has exactly one poll.** The
Areas are where it actually runs; the **Places** it is listed under are derived
from them. One poll across all of a Campaign's Areas, not one poll per Area.

**What ships today is narrower**: exactly one Place, no Areas at all (ADR 0008).
That ADR is the accurate description of the code and is now out of step with the
agreed model above; it needs superseding rather than quiet contradiction. Utah
and Oregon are two Campaigns under the shipped rule, and would be one Campaign
over two Areas under the new one.

The Conversation behind a Campaign is slugged `<campaign>-<place>` (`ai-utah`),
derived automatically when the Place is saved. Under the Area model a derived
Place cannot supply that suffix, so the slug scheme is an open question (ADR
0007). The participant URL is `/<org>/conversations/<conversation-slug>` on one
host (ADR 0007, ADR 0011); the `<org>` segment is decorative, so a Campaign has a
participant site from the moment it is created.

**A Campaign has exactly one Polis step.** comhairle's model is more general: a
Conversation runs a workflow of many steps (`polis`, `learn`, `heyform`,
`stories`, `elicitationbot`), and its own frontend offers "+ Add step". Civic OS
deliberately narrows that to the single-Polis case, so "the Campaign's poll" and
"the Campaign's Polis step" are the same thing. Anything needing that step
resolves it as *the polis-typed step of the active workflow*, and a second one
is out of scope rather than handled.

This is a Civic OS constraint, not a comhairle guarantee. Nothing stops a Host
adding a second Polis step from the comhairle frontend, and comhairle is already
tracking the consequences of two (their issue 799, on vote-progress gating keyed
by poll id rather than step). If that becomes real, the assumption breaks here
first.

**A Campaign is servable only once its poll is mirrored.** Having the step is not
the same as being able to serve it. `GET /conversation/:id/workflow_step` is 401
to the anonymous participant app, so civicos never reads the step: it reads
`metadata.poll.polisId`, which admin writes on creation and again on going live.
A Campaign with a working step and no mirror is reachable, renders its homepage,
and cannot be voted in.

Neither write is guaranteed. Creation logs a mirror failure rather than rolling
back, and a step comhairle has not finished provisioning reports no poll id to
mirror at all. So the invariant is stated and checked rather than assumed: admin
shows `campaign.pollBlocker` in the Campaign header with a one-click repair, and
civicos answers 503 from `/contribute` instead of opening a poll that is not
this Campaign's. `pollFor` in `campaign.ts` is the single place the poll
resolves, so the guard and the voting screen cannot disagree about whether there
is one.

### Host
An **Organization** that stewards Campaigns in its community. Modeled in comhairle
as `Organization` (`name`, `description`, `mission`, `contact_email`, `external_url`,
`org_type` of `non_profit | governmental | other`, `regions: Uuid[]`, plus member
users). `Host ↔ Organization` is product word ↔ comhairle model.

A Campaign has **one owning Host** (`Conversation.organizationId`, read-only) and
zero or more **Co-Hosts** (other Host Organizations granted a role on the Campaign;
see Co-Host). The earlier "lead Organization for a Region's Conversation" framing
is superseded: "lead" = the owning Host, and other Hosts attach as Co-Hosts.
`hostName` / `hostUrl` in `regions.ts` are static duplicates of the owning Host.

**Term collision — beware.** The Insights "Author" column also uses the word
"Host", but there it means something narrower: *a statement that came from the
seed/host authoring process* (`is_seed = true`), **not** the Host Organization.
The dashboard label is **"Host"** for seed statements and **"Participant"** for
the rest. When we say "Host" unqualified in this glossary we mean the
Organization; the Author-column sense is always spelled out.

### Co-Host
A Host **Organization** attached to a Campaign that it does not own. Mechanically,
a Co-Host is an org **granted a role on the Conversation** via `GrantPermission`
(`POST /permissions/Conversation/:id`, body `{ organization_id, role_name, grant_reason }`;
`resource_type` casing is significant, use `Conversation`). The granted `role_name`
is **`content_editor`** (`ConversationContentEditor`), currently the only
Conversation-level role. **Provisional:** whether this role also propagates Campaign
visibility to the co-host's members (dashboard/homepage, the #362 goal) is
unconfirmed with the backend; a dedicated co-host role may replace it. Listing a
Campaign's Co-Hosts = `ListResourcePermissions` on that Conversation, then
`GetOrganization` per org id. Distinct from the single read-only **owning** Host in
`Conversation.organizationId`. Added via the admin "Co-Hosts" card (#362).

### Partner
Retired alias for **Co-Host** (a coalition Organization that contributes to a
Campaign but is not the owning Host). "Co-Host" is canonical going forward; the
static `regions.ts` `partners[]` is tech-debt to rename.

### Super user (Site SuperAdmin)
A user holding the `super_admin` role on the `system` resource in comhairle's
`resource_permissions` (`resource_type = 'system'`, `resource_id` = nil UUID). This
is BLOOM / Crown Shy staff who may create Hosts and Places (#372, #382). Narrower
than the admin app's binary `isAdmin` gate (which only proves *some* admin access).

The frontend detects this via **`GetUserOrganizations.canCreateOrganization`**, the
backend's computed capability flag, *not* `GetUserRoles` (that handler is currently
a stub that only ever reports `Admin`). `canCreateOrganization` is true only for
Site super-admins, because `OrganizationCreate` is authorized solely through the
super-admin bypass in `can_perform_resource_action`. The `/sysadmin` surface gates
on this flag (named `canCreateHost` in the admin app).

### Organization member
A user affiliated to exactly one Host (`User.organizationId`), as either an
**admin** or a plain **member** (`OrganizationTeamRole = member | admin`). Members
are added **after** the Host exists via `AddOrganizationMember`
(`POST /organizations/:id/members`, body `{ email, role, allow_create_user }`);
with `allow_create_user` it bootstraps an account for an unregistered email and
emails a set-password link (response reports `createdAccount` / `emailed`). Role is
changed with `UpdateOrganizationMemberRole`.

There is **no single owner**: creation is limited to Super users, and any org admin
can edit the Host; Super users can always manage every Host, so an org with no
admins is never truly orphaned. Creating a Host grants the creator the
`OrganizationAdmin` *permission* but does **not** add them to the org's team list
(`GetOrganizationTeam` starts empty on a fresh org). The admin UI guards against a
user removing or demoting **themselves**. Distinct from a Campaign **participant**
(a voter), who is not an org member.

### Polis conversation
The external Polis-side artifact identified by `polisId`. The `polis_workflow_step_id`
links a comhairle workflow step to a Polis conversation.

### Key Question
The question a Campaign puts to its participants, shown on admin Setup. It is
**the same value as the Polis conversation's Topic**, not a separate field:
read from the Polis workflow step's `toolConfig.topic`, written with
`PolisUpdateConfig({ workflow_step_id, topic })`. Comhairle's own admin edits
it under the name **Topic**, so the two surfaces are two editors of one value.
A legacy region's hardcoded `question` in `regions.ts` is only a fallback, for
Campaigns whose Polis step does not resolve.

### Participant site
Where participants actually go:

    <host>/<org>/conversations/<conversation-slug>

`civicos` resolves the Campaign from the **slug** alone; nothing about the
hostname is read (ADR 0011). The `<org>` segment is decorative, ignored on
resolution (ADR 0007). The poll is `/contribute` under that path, and live
events are `/events/<event-slug>`. A Place's Campaigns are listed at
`/<place-slug>`.

Three things the admin surfaces have to respect:

- **Every Campaign has a participant site from the moment it is created.** It
  needs no `regions.ts` entry, code change or deploy, and publishing it to a
  Place adds it to that Place's page without moving it.
- **The URL is derived, never stored.** `participantUrl()` in
  `@civicos/shared/data/place` is the only thing that builds it. Admin no longer
  prefers a legacy region's `shareUrl`, which names a Place subdomain.
- **`is_live` does not gate the participant app.** `civicos` never reads it, and
  `/contribute` talks to Polis directly, bypassing comhairle. Today the flag only
  drives the admin badge, so a "draft" Campaign that has been published to a
  Place is publicly reachable and votable.

Which poll a participant votes in comes from `metadata.poll`, mirrored by admin
on publish, because the Polis workflow step is 401 to an anonymous caller. Where
that is missing it falls back to `regions.ts` keyed by zip.

### Dev region
A synthetic Region built at runtime from `PUBLIC_DEV_*` env vars, so a local
checkout can target a locally-seeded conversation. Implemented in both `civicos`
and `admin` via the same overlay pattern; the same env var names work for both apps.

### Statement author (Author column)
Who wrote a statement, as shown in the Insights tables. The report payload
(`ReportComment`) carries only `tid` (the statement id) and `is_seed` — it does
**not** carry the author's Polis participant id. So the column can only
distinguish *seed/host-authored* (`is_seed = true`, labelled **"Host"**) from
everyone else (labelled **"Participant"**). Showing the real participant id
(e.g. `23`, as in the Figma mock) is **blocked** on a backend change that adds
the author pid to `ReportComment`. Assumption to confirm: the seed author is
always Polis pid `0`.

### Color Scheme
The one accent colour a Host picks for a Campaign's participant pages, from a
fixed list in `@civicos/shared/data/color-scheme` (Green, Slate, Plum and five
more). It sets `--primary`, `--ring` and `--secondary` and nothing else: the page,
body text, Disagree and END look the same in every scheme. Green is the default
and is what `theme.css` ships.

**Color Scheme, not Theme**, because a Theme in this product is a topic tag on a
statement (below). Say Color Scheme for how it looks and Theme for what a
statement is about.

Stored as an id on `Conversation.metadata.colorScheme`, never as hexes. It
replaced the Brand from #428, which let a Host edit 17 tokens and write custom
properties (ADR 0012).

### Theme
A topic tag attached to a statement. **Themes are human-authored today** — a
host adds them via the admin picker, and they live in the comhairle
`polis_statement_aux.themes: string[]` column. Polis itself has no theme
concept, and `sync` never imports one. Later, Talk-to-the-City (T3C) will write
machine-generated themes into the *same* aux store, so the Themes table's data
source does not change when T3C lands.

The report payload's `comment.topics?: string[]` is a slot for that future
NLP source and is **empty today**; the Insights page overlays `aux.themes` onto
`comment.topics` so the report utils (which read `topics`) work unchanged. The
Themes table reads only aux-sourced themes — the empty `topics` fallback is
dropped.

### All Statements
The full, theme-filterable statement list at the bottom of the Insights page
(header "All Statements", "N statements in total. Use labels below to filter by
theme."). Formerly called "Theme Explorer" in code — **"All Statements" is now
the canonical name**; any lingering "Theme Explorer" identifiers are aliases to
retire. The Themes-table arrow ("→") jumps here, selecting that theme's chip and
scrolling the section into view.

### Controversy
A coined classification for a Theme — `low | moderate | high` — derived from
the average per-statement group-agree spread across statements tagged with
that theme. Spread for a statement = `max(agree%) − min(agree%)` across
groups. (Assumptions, let's confirm) Buckets: `<15` low, `15–30` moderate, `>30` high. Defined and tunable in `packages/admin/src/lib/utils/report.ts`. Not a Polis or T3C concept — it's our own roll-up for the Insights dashboard? 

### Area of Consensus
A statement where every group lands on the same side — all groups' agree% ≥ 80
(consensus `+`) or all < 20 (consensus `−`). Surfaced as the "Areas of Consensus"
section on the Insights dashboard. Thresholds `CONSENSUS_AGREE` / `CONSENSUS_DISAGREE`
in `packages/admin/src/lib/utils/report.ts` (ticket 286).

### Area of Difference
A statement where the agree% gap between the most- and least-agreeing groups exceeds
30 points (`max(agree%) − min(agree%) > 30`); one diverging pair is enough. Surfaced
as "Areas of Difference." Same 30-point cut as high **Controversy**, but applied
per-statement rather than averaged across a Theme's statements.

### Area of Uncertainty
A statement whose pass% sits well above the average pass rate across all statements
(`≥ avg + stdev`, or `≥ 30%`). Defined in `report.ts`, but **deferred from the
redesigned Insights UI** — the current design ships Consensus and Difference only;
how to present Uncertainty is an open question.

### Low data quality
A coined classification for a statement whose per-group vote counts are too thin
to trust. The report payload has no quality field, so this is a tunable
heuristic: **any group with fewer than 10 total votes (agree + disagree + pass)
on the statement → low quality** (`min(per-group votes) < 10`). A per-group
minimum is used rather than a grand total because every Insights table compares
group agree%s, and one barely-voted group yields a meaningless percentage (e.g.
100% from 3 votes) that can spuriously read as consensus or difference.

Low-quality rows are **hidden by default across all three statement tables**
(Areas of Consensus, Areas of Difference, All Statements) but **stay counted**
in the totals. Each table's low-quality set is revealable, and the reveal is
reversible. (Retires the earlier `totalVotes < 7` grand-total definition.)

### Events
Upcoming live conversations (in-person or online) attached to a Region. Today
embedded in `regions.ts` as `ConversationEvent[]`; partially modeled in comhairle
via workflow steps and the `event_id` migration.

### Recording
An uploaded audio file for an Event, processed into a transcript and an analysis
report. Comhairle `AudioRecordingDto`: `id`, `eventId`, `name`, `fileExtension`,
`status`, `createdAt`, `updatedAt`, `s3KeyPrefix`. **No `duration` field** — the
"1:08:13" shown on cards comes from the audio element's metadata, not the DTO.
Ops available: Create, Delete, Get, List, Process, SubmitReport. **There is no
rename/update op** — a recording is named once, at Create time
(`CreateRecordingRequest.name`). `GetAudioRecording` also returns `downloads`
(`recordingUrl`, `transcriptUrl`, `reportUrl`).

_Status lifecycle_ (`AudioRecordingStatus`): `awaiting_upload` → `transcribing`
→ `categorizing` → `complete`, with terminal failures `transcription_failed`
and `categorization_failed`. There is **no "upload error" status** — a failed
client upload just leaves the recording in `awaiting_upload`; the "Upload Error.
Retry?" card is a client-side affordance over that state, distinct from a
pipeline re-run (which we deliberately do **not** offer — see below).

### Report (recording analysis)
The categorized analysis of a Recording, fetched from `downloads.reportUrl`.
Shape: `topics[] → subtopics[] → claims[{ title, quotes[] }]`, where a quote
carries `reference.sourceId` linking it back to a transcript event (so a quote
can seek the audio). The recording **detail card** renders this tree with a
remapped vocabulary — keep these straight:

| Detail-card element | Report field |
|---|---|
| Top **theme chips** (ACCESS & EQUITY…) | `topic.title` |
| Expandable **theme rows** (red dot + "N QUOTES") | `subtopic` |
| Quote block's red one-line **summary** | `claim.title` |
| Quote body text | `quote.text` |
| **VIEW IN CONTEXT →** | seek audio to `quote.reference.sourceId` |
| **N HIGHLIGHTS** | alias for quote count — no separate "highlights" field exists |

### Pipeline re-run (non-affordance)
A deliberate **absence**. When transcription or categorization fails, the UI
shows the error state (and, on the detail card, a "We have a problem… contact
hello@bloom-project.org" message) but offers **no button to re-run the
transcript/report pipeline**. Per Mike: recovery is an ops concern (observability
+ alerts so the dev team resolves failures), not a user-facing control. Only the
client-side **upload** retry is offered.

---

## Open problem #1 — Region/Conversation/Host data model

> **Partly answered by the Place/Area model.** Buckets A and C below assume a
> Place is a single value on a Conversation. The agreed direction is a Campaign
> attached to **Areas**, with Places derived from them, which moves `zipPrefixes`
> out of the static map and into the Area records comhairle already has
> (`region_areas`). The missing piece is a Conversation-to-Area link. See the
> Area and Place entries above, and the team doc's Place & Area tab.


The current `RegionConfig` shape in `packages/shared/src/data/regions.ts` mixes
four concerns. Bucketing each field against what comhairle already stores:

### A. Already covered by comhairle (delete-once-migrated)
- `conversationId`, `inviteId`, `slug` (per conversation), `question`, `faq`,
  `aboutConversation`, `events`, `hostName`, `hostUrl`, `partners[]`

### B. Polis bridge
- `polisId`, `polis_workflow_step_id`

Both are **readable from comhairle** as of the #401 work:
`/conversation/:id/workflow/:workflow_id/workflow_step` returns the Polis step,
whose `id` is `polis_workflow_step_id` and whose `toolConfig.poll_id` is
`polisId`. Admin resolves them that way for Campaigns with no `regions.ts` entry;
legacy regions keep using their configured value until the two are confirmed to
match. See `docs/adr/0004-admin-resolves-conversations-from-the-backend.md`.

### C. Region-level fields with no model behind them
- `stateName`, `demonym`, `zipPrefixes[]`, `shareUrl`, `hostsBlurb`,
  `phaseLabels`, `conversationsActive`

Comhairle **now has a `Region` table** (identity, name, description, `region_type`,
`official_id`) with full CRUD in the client — so bucket C can partly live there
already. What the comhairle Region still lacks: `zipPrefixes`, subdomain/`shareUrl`,
`demonym`, `phaseLabels`. Those remain in the static `regions.ts` overlay.

### D. Pure presentation copy
- `heroHeader`, `heroBlurb`, `contextParagraphs[]`, `hostMessage[]`,
  `campaignPageDescription`, `campaignPageHosts`, `whatsNext`, `goDeeper`,
  `endCtaJoinDescription`, `endCtaShareDescription`, `fullHosts`

These don't model anything domain-level — they're landing-page copy tied to a
specific render. Don't fit comhairle's data model and shouldn't.

**Admin no longer reads this map as its Campaign list** — it renders from
`GetPermittedConversations` and keeps `regions.ts` only as an overlay for
`shareUrl`, `question`, and `zipPrefixes` (#397, #401). `civicos` still reads the
whole map, so nothing below can be deleted yet.

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
