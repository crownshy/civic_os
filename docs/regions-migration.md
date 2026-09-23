# Retiring regions.ts

`packages/shared/src/data/regions.ts` holds every per-Campaign string as
checked-in developer config. It is the default layer behind a Campaign now,
not the source of truth, but it is still what a participant sees wherever the
backend has nothing to say.

That matters more than it used to. A Campaign created in admin has no
`regions.ts` entry of its own, so `regionForCampaign` hands it `GENERIC_REGION`,
the USA catch-all. Every field below that has not been migrated renders The
Bloom Project's own copy on some other Host's Campaign.

The Disposition column in the field table is a product decision, not an
inferred one. Treat it as the spec.

## Status: what a Host controls today

| Participant surface                       | Backend field                                            | Where admin edits it             |
| ----------------------------------------- | -------------------------------------------------------- | -------------------------------- |
| Landing `<h1>` and page title             | `Conversation.title`                                     | Setup > Identity                 |
| The `/<org>/conversations/<slug>` address | `Conversation.slug`                                      | Setup > Identity                 |
| Landing "Context" sections and nav pills  | `Conversation.description`                               | Setup > Context for Participants |
| Voting question                           | Polis step `topic`, mirrored to `metadata.poll.question` | Setup > Identity > Key Question  |
| Landing FAQ accordion                     | `Conversation.faqs`                                      | Setup > FAQ                      |
| Landing Place chip, slug suffix           | `metadata.place`                                         | Setup > Identity > Place         |
| Palette                                   | `metadata.colorScheme`                                   | Setup > Identity > swatches      |
| About You screen                          | `metadata.demographics`                                  | Setup > Demographics             |
| Checkpoint and end-page asks              | `metadata.participantAsks`                               | Setup > Participant Asks         |
| Which Polis poll the vote goes to         | `metadata.poll.polisId`                                  | Written at creation, no editor   |
| Upcoming live conversations               | `GET /conversation/:id/events`                           | Events tab                       |

Copy resolves through `packages/civicos/src/lib/config/host-copy.ts` and
identity through `campaign.ts`, both as `conversation.X ?? region.X`, so Utah
and Oregon render what they rendered before until a Host saves something.

### How the Conversation is found

Nothing about the hostname picks a Campaign (ADR 0011). The URL is
`/<org>/conversations/<conversation-slug>` and the last segment names it.
`campaignCandidates()` turns that slug into an ordered list and takes the first
that resolves against `GET /conversation/:idOrSlug`, which accepts either form:

1. `region.conversationId`, but only when the slug names a `regions.ts` entry.
   This leads so `/utah` and `/oregon` keep resolving to the Campaign they
   always did, even if some other Conversation later takes those slugs.
2. The slug itself.

Nothing else. A slug naming no Campaign is a 404, not a reason to serve a
different one. The exception is a legacy region whose backend is unreachable:
Utah still renders from `regions.ts` rather than going dark.

`PUBLIC_CAMPAIGN_SLUG` says which Campaign the root `/` redirects to on a
deployment that has no legacy subdomain. It takes no part in resolution.

## What a Campaign created in admin still gets from regions.ts

Nothing a participant can see. Every surface that used to render
`GENERIC_REGION` now renders the Host's own value, a fixed string, or nothing
at all.

What is left is last-resort identity, reached only when a Conversation field is
empty, and never copy:

| Surface                           | Read site                        | Field                                   | When it is reached                                            |
| --------------------------------- | -------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| Campaign title                    | `campaign.ts:169,188`            | `heroHeader`                            | `Conversation.title` is empty, which the Setup schema forbids |
| Key question                      | `[campaign]/+page.svelte:36`     | `question`                              | `metadata.poll.question` is missing                           |
| `<org>` URL segment               | `campaign.ts:173,193`            | `hostName`                              | `metadata.org` was never mirrored. Decorative either way      |
| Place chip                        | `campaign.ts:244`, `place.ts:32` | `stateName`, `slug`                     | The Campaign has no `metadata.place`                          |
| Report data                       | `report/+page.server.ts:19`      | `polis_workflow_step_id`                | Legacy regions only, gated on `isLegacyRegion`                |
| Voting poll                       | `contribute/+page.svelte:58`     | `polisId`                               | Legacy regions only, gated on `isLegacyRegion`                |
| Landing Context, What's Next, FAQ | `host-copy.ts`                   | `contextParagraphs`, `whatsNext`, `faq` | Legacy regions only, gated on `isLegacyRegion`                |
| Hosted by, Your Hosts             | `campaign.ts:148`                | `partners`                              | Legacy regions only, gated on `isLegacyRegion`                |

The four `isLegacyRegion` rows are Utah's and Oregon's live copy. They go when
those two Campaigns have their values saved into their own records, which is
the one step left.

## Hardcoded outside regions.ts

- **`packages/civicos/src/lib/data/mock.ts`** feeds `popQuizQuestions` to the
  contribute flow and carries Utah copy. It only reaches the `pop-quiz` and
  `did-you-know` screens, both marked "unused in conference flow", so this is
  dead weight rather than a live leak. `DidYouKnowScreen.svelte` hardcodes a
  Utah statistic on the same dead screen.
- **`PROMPTS` in `participation.ts`** phrases each demographic question. Admin
  owns the category and its options but not the wording. Deliberate for now.
- **The four `DEFAULT_FAQ` placeholders** in `regions.ts` read as real answers
  rather than as placeholders. Only Utah and Oregon can reach them now.
- **`PUBLIC_POLIS_URL`** in `services/api.ts` names the Polis server for the
  deployment. Kept deliberately: it is not a property of any one Campaign, and
  `metadata.poll.polisUrl` overrides it per Campaign.
- **Landing section headings** ("What is an \"Open Poll\"?", "Your Hosts",
  "What's Next?", "Stay in touch."), `HERO_BLURB`, `END_CTA_COPY` and the
  privacy block are fixed UI copy. Intentional, per the Remove dispositions
  below.
- **`@civicos/report`** is the Central Oregon report, hardcoded end to end,
  deployed separately. Out of scope here.

## Work plan

Ordered so each step ships something a Host can see. Check items off in place.

### Milestone A: nothing shows another Host's identity

Done. A Campaign created in admin no longer renders any of the catch-all's
identity.

- [x] Report page reads `campaign.poll.workflowStepId`, falling back to the
      region only for a legacy region (#401).
- [x] `shareUrl` derived from the request through `participantUrl()`, and the
      share copy phrased from the Campaign title rather than a state name and
      demonym. Field deleted.
- [x] civicos reads co-hosts for "Hosted by" and "Your Hosts", from
      `metadata.cohosts`, which admin now mirrors on every grant, revoke and
      Campaign creation. `hostsBlurb` deleted; `partners` survives only as the
      legacy-region fallback behind `Campaign.cohosts`.
- [x] The "About This Conversation" dialog renders the Host's own
      `Conversation.description`. `aboutConversation` deleted.
- [x] "A Message from Your Hosts" deleted. It had no trigger and could not be
      opened. `hostMessage` deleted with it.
- [x] `heroBlurb` deleted, replaced by `HERO_BLURB` in `landing-copy.ts`.
- [x] `goDeeper` deleted; `endCtaJoinDescription` and `endCtaShareDescription`
      replaced by `END_CTA_COPY` in `landing-copy.ts`.

Cleaned up in the same pass, all of it unreachable code found on the way:

- [x] `AboutBar.svelte` deleted. No call sites.
- [x] InfoBar's "About this Conversation" dialog deleted. Its ABOUT button is an
      `href` to `/campaign/ai`, so the dialog could not open. InfoBar no longer
      takes a `region` at all, which removed the prop from eight components.
- [x] `RegionConfig.events` and `RegionConfig.fullHosts` deleted.
- [x] `packages/civicos/src/lib/data/utah-counties.ts` deleted.

### Milestone B: an editor for every field civicos already reads

Done.

- [x] `thankYouMessage` has an editor: Setup > Context for Participants > What
      Happens Next. It joins the debounced superform alongside Title and
      Description. It is a nullable TextContent reference like `faqs`, so an
      unset one has no record to write against and the first save creates it,
      which `writeTextContent` now does for both.
- [x] Event host name and URL come from `metadata.org`, which gained a `url`.
      `mirrorHosts` writes it on every grant, revoke and Campaign creation, so
      a Campaign mirrored before the field existed picks it up rather than
      waiting to be recreated. A Campaign with no Host, or a Host with no site,
      drops the clause instead of crediting somebody else.
- [x] `conversationsActive` is derived from whether the Campaign has any
      events, and the field is deleted. It was declared on `RegionConfig` and
      set by no region, so it read as true everywhere and the Coming Soon
      branch on the events page could never render. A Host opens registration
      by creating events, which is the same decision without a second switch.
- [x] `Conversation.callToAction` stays unclaimed, deliberately. Nothing in
      either app reads or writes it, and no participant surface wants it.
      Building an editor would ship the mirror image of the problem this
      milestone exists to fix: a field a Host can fill in that nobody ever
      sees. Claim it when a surface needs it.

Cleaned up in the same pass:

- [x] `getEventFullDescription` deleted. Its only mention was a comment, and it
      takes the `ConversationEvent` shape `regions.ts` stopped storing.

### Milestone C: the fallback itself goes

Everything except the hand migration, which is the last step and needs a human.

- [x] Voting resolves its Polis conversation from the Campaign, falling back to
      `regions.ts` only for a legacy region (#422). A Utah zip used to put a
      participant in Utah's poll whichever Campaign they had opened.
- [x] `PUBLIC_CONVERSATION_ID` and `PUBLIC_POLIS_ID` retired (#421). Both named
      one record for a whole deployment, from before a Campaign was a stored
      thing. `PUBLIC_POLIS_URL` stays: it names the Polis server, which is a
      property of the deployment rather than of a Campaign, and
      `metadata.poll.polisUrl` overrides it per Campaign.
- [x] `zipPrefixes` decided: nothing scopes by it any more. Admin's county
      rollup, county list and map are derived from the zips participants
      actually entered, which is what every Campaign created in admin needed
      (they all had no prefixes, so their Geography section was blank), and the
      landing page's zip typeahead waits for the participant to type. Places
      are still being worked out (#404, #405), so a scope waits for something
      that can express one. The field survives only for `getRegionByZipcode`,
      which is only how the landing page redirects a Utah zip opened on Oregon.
- [x] `/campaign/ai` deleted. It sat outside `[campaign]`, so it always
      rendered the catch-all: "AMERICANS Speak", a Utah-only get-involved link
      and three hardcoded phase labels, whoever was hosting. InfoBar's ABOUT
      button, which is on every voting, events and report screen, now goes to
      the Campaign's own homepage, which carries the Host's Context, their FAQ
      and who hosts it. That retired `demonym`, `campaignPageDescription`,
      `campaignPageHosts`, `phaseLabels` and `hostUrl`.
- [x] `GENERIC_REGION` no longer supplies copy to a Campaign it is not.
      `resolveHostCopy` and `resolveFaq` take the region only where it IS the
      Campaign, so a Host who has not written their Context or FAQ gets no
      section rather than The Bloom Project's description of itself (#425). The
      landing page drops What's Next and its nav pill on the same rule.
- [ ] Save Utah's and Oregon's live values into their Conversation records by
      hand. **This is the remaining blocker.**
- [ ] Delete `GENERIC_REGION` and `regions.ts` once that is done.

What `RegionConfig` still carries, and why, now that it is 13 fields rather
than 30:

| Still there                                         | Why it cannot go yet                                                |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `slug`, `conversationId`                            | Resolve `/utah` and `/oregon` to the Campaign they always were      |
| `zipPrefixes`                                       | `getRegionByZipcode`, for the landing page's legacy zip redirect    |
| `polisId`, `polis_workflow_step_id`                 | The poll and report for Utah and Oregon                             |
| `hostName`, `stateName`                             | The `<org>` segment and the Place chip for the two legacy regions   |
| `question`, `heroHeader`                            | Last-resort identity when a Conversation field is empty             |
| `contextParagraphs`, `whatsNext`, `faq`, `partners` | Utah's and Oregon's live copy, until it is saved into their records |

### Cleanup, any time

- [x] `RegionConfig.events`, `RegionConfig.fullHosts` and `utah-counties.ts`
      deleted in Milestone A.
- [x] The three remaining citations of the deleted ADR 0003 repointed.
- [ ] Rewrite `DEFAULT_FAQ` so a Host and a reviewer can tell it is seed copy.
      Lower stakes now that only Utah and Oregon can ever see it.

## Field dispositions

**Keep** means the concept survives, usually renamed and rehomed. **Remove**
means it stops being per-Campaign configuration: either the surface is gone, the
value is derived, or the copy becomes hardcoded UI text.

| Field                     | Type                  | Rough limit        | Disposition                              | What it is                                                                   |
| ------------------------- | --------------------- | ------------------ | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `slug`                    | string                | ~20, URL-safe      | **Done**                                 | `Conversation.slug`                                                          |
| `stateName`               | string                | ~30                | **Done** as Place                        | `metadata.place.name`, see ADR 0006                                          |
| `demonym`                 | string                | ~20                | **Done**                                 | Deleted with `/campaign/ai`                                                  |
| `question`                | string                | ~150               | **Done** as Key Question                 | The Polis step's `topic`, mirrored to `metadata.poll.question`               |
| `polisId`                 | string                | ~15                | **Done**                                 | `metadata.poll.polisId`. Legacy regions only, now                            |
| `conversationId`          | UUID                  | 36                 | **Move**                                 | The Conversation this Campaign is                                            |
| `inviteId`                | UUID                  | 36                 | **Move**                                 | Invite record for this Campaign                                              |
| `hostName`                | string                | ~50                | **Done** on the Host                     | `metadata.org.name`                                                          |
| `hostUrl`                 | url                   |                    | **Done** on the Host                     | `metadata.org.url`. Field deleted                                            |
| `zipPrefixes`             | string[]              |                    | **Done**                                 | Nothing scopes by it; survives only for `getRegionByZipcode`                 |
| `heroHeader`              | string                | ~60                | **Done** as Title                        | `Conversation.title`                                                         |
| `heroBlurb`               | string                | ~250               | **Done**                                 | Deleted. `HERO_BLURB` in `landing-copy.ts`                                   |
| `contextParagraphs`       | string[]              | ~500 each          | **Remove**                               | Superseded by the single rich-text Basic Description                         |
| `hostsBlurb`              | string, HTML          | ~250               | **Done**                                 | Deleted. Your Hosts is generated from the co-host list                       |
| `partners`                | `{name, url}[]`       | name ~50, url ~100 | **Done** as CoHosts                      | `metadata.cohosts`. `partners` survives only as the legacy-region fallback   |
| `hostMessage`             | rich text             | ~600 each          | **Done**                                 | Deleted with its unreachable dialog                                          |
| `aboutConversation`       | string[]              | ~400 each          | **Done**                                 | Deleted. The dialog renders `Conversation.description`                       |
| `campaignPageDescription` | string                | ~300               | **Done**                                 | Deleted with `/campaign/ai`                                                  |
| `campaignPageHosts`       | string, HTML          | ~300               | **Done**                                 | Deleted with `/campaign/ai`                                                  |
| `whatsNext`               | string                | ~300               | **Done** as the Open Poll ending message | `Conversation.thankYouMessage`, editable on Setup                            |
| `goDeeper`                | string, HTML          | ~300               | **Done**                                 | Deleted                                                                      |
| `faq`                     | shared constant       |                    | **Done** as `Conversation.faqs`          | One rich-text field, `h2` per question, parsed by `@civicos/shared/data/faq` |
| `endCtaJoinDescription`   | string                | ~100               | **Done**                                 | `END_CTA_COPY` in `landing-copy.ts`                                          |
| `endCtaShareDescription`  | string                | ~100               | **Done**                                 | `END_CTA_COPY` in `landing-copy.ts`                                          |
| `polis_workflow_step_id`  | UUID                  | 36                 | **Done**                                 | `metadata.poll.workflowStepId`. Legacy regions only, now                     |
| `shareUrl`                | url                   | ~50                | **Done**, derived                        | `participantUrl()` off the request. Field deleted                            |
| `events`                  | `ConversationEvent[]` |                    | **Done**                                 | `GET /conversation/:id/events`. Field deleted                                |
| `conversationsActive`     | boolean               |                    | **Done**                                 | Derived from the Campaign's events. Field deleted                            |
| `phaseLabels`             | `{phase1,2,3}`        |                    | **Done**                                 | Deleted with `/campaign/ai`                                                  |
| `fullHosts`               | string                |                    | **Done**                                 | Deleted                                                                      |

## What has to happen before a field can go

1. A backend field to hold it, or a rule that derives it.
2. An editor in admin, otherwise the field ships dead. Nothing is in that state
   now; `callToAction` is the inverse, a field with no reader, and stays
   unclaimed until a surface wants it.
3. The live Utah and Oregon values saved into their Conversation records. Until
   that is done by hand, removing the `regions.ts` entry removes the copy from
   a live site.
4. The `?? region.X` fallback dropped, and the entry deleted.

## Open questions

- `zipPrefixes` has no disposition. It does two unrelated jobs (typeahead
  scoping and the county rollup) and probably wants splitting before it moves.
- `Conversation.callToAction` still has no reader and no writer. Milestone B
  left it alone on purpose rather than giving a Host a field nobody sees.
- Whether the Open Poll ending message stays a separate field or merges into
  Basic Information. The table keeps it separate, which is what #398 built.
- Whether "A Message from Your Hosts" and "About This Conversation" are two
  dialogs worth keeping at all, or one more section of the Context copy.

Related: ADR 0004, ADR 0006, ADR 0007, ADR 0008, ADR 0011, ADR 0012,
#349, #351, #362, #366, #398, #401, #414, #421, #422, #425, #429.
