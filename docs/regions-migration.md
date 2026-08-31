# Retiring regions.ts

`packages/shared/src/data/regions.ts` holds every per-Campaign string as
checked-in developer config. Milestones 12 and 13 move that to Host
configuration served by Comhairle. This note records which fields survive that
move, which are dropped, and where the survivors live instead.

The dispositions below are a product decision, not an inferred one. Treat the
Disposition column as the spec.

## Status

Five fields are wired. Everything else still reads `regions.ts`.

| Participant surface | Backend field | Editable in admin? |
| --- | --- | --- |
| Landing "Context" section | `Conversation.description` | Yes, Setup > Context for Participants > Basic Description |
| Landing "What's Next?" and the Open Poll end screen | `Conversation.thankYouMessage` | No editor yet (#366) |
| Which Conversation the app serves | `Conversation.id` | n/a, resolved |
| Landing `<h1>` and page title | `Conversation.title` | Yes, Setup > Identity > Title |
| Landing Place chip | `Conversation.metadata.place` | No, seeded (ADR 0006) |

Copy resolves through `packages/civicos/src/lib/config/host-copy.ts` and
identity through `campaign.ts`, both as `conversation.X ?? region.X`, so Utah
and Oregon render what they rendered before until a Host saves something.
`regions.ts` is the default layer now, not the source of truth. It cannot be
deleted until every live region has been migrated by hand.

### How the Conversation is found

`regions.ts` used to answer this on its own: the subdomain picked a
`RegionConfig` and that config carried a hardcoded `conversationId`. The
Campaign slug is now the first path segment (ADR 0007), so the URL names it.
`campaignCandidates()` turns that slug into an ordered list and takes the first
that resolves against `GET /conversation/:idOrSlug`, which accepts either form:

1. `region.conversationId`, but only when the slug names a `regions.ts` entry.
   This leads so `/utah` and `/oregon` keep resolving to the Campaign they
   always did, even if some other Conversation later takes those slugs. It is
   offered only on a match: `getRegionBySubdomain` answers `GENERIC_REGION` for
   any subdomain it does not know, and that hardcoded id must never stand in for
   a slug nobody asked for.
2. The slug itself.

Nothing else. A slug naming no Campaign is a 404, not a reason to serve a
different one. The exception is a legacy region whose backend is unreachable:
`/utah` still renders from `regions.ts` rather than going dark.

The resolved Campaign must then belong to the Place in the subdomain, or the
route 404s. See ADR 0007, including what Comhairle's move to per-organization
slugs will break here.

`PUBLIC_CAMPAIGN_SLUG` no longer takes part in that. It says which Campaign the
Place root `/` redirects to, which has to be configured because a Place is not a
record and nothing can enumerate the Campaigns in one (ADR 0006).

## Field dispositions

**Keep** means the concept survives, usually renamed and rehomed. **Remove**
means it stops being per-Campaign configuration: either the surface is gone, the
value is derived, or the copy becomes hardcoded UI text.

| Field | Type | Rough limit | Disposition | What it is |
| --- | --- | --- | --- | --- |
| `slug` | string | ~20, URL-safe | **Done** | `Conversation.slug`. The `/<campaign-slug>` path segment |
| `stateName` | string | ~30 | **Done** as Place | `metadata.place.name`, see ADR 0006 |
| `demonym` | string | ~20 | **Remove?** | "Utahns". Needs generalizing, or the copy that uses it becomes editable so the term is not needed |
| `question` | string | ~150 | **Keep** as Key Question | The deliberative question. Already editable in Setup; it is the Polis `topic`, not a Conversation field |
| `polisId` | string | ~15 | **Move** | Resolved from the Polis workflow step, see ADR 0004 |
| `conversationId` | UUID | 36 | **Move** | The Conversation this Campaign is |
| `inviteId` | UUID | 36 | **Move** | Invite record for this Campaign |
| `hostName` | string | ~50 | **Keep** on the Host | Resolved from `Conversation.organizationId` in admin already |
| `hostUrl` | url | | **Keep** on the Host | |
| `zipPrefixes` | string[] | | Undecided | Scopes participant validation and the county rollup |
| `heroHeader` | string | ~60 | **Done** as Title | `Conversation.title`, editable in Setup |
| `heroBlurb` | string | ~250 | **Remove** | Becomes hardcoded UI copy |
| `contextParagraphs` | string[] | ~500 each | **Remove** | Superseded by the single rich-text Basic Description |
| `hostsBlurb` | string, HTML | ~250 | **Remove** | |
| `partners` | `{name, url}[]` | name ~50, url ~100 | **Keep** as CoHosts | #362 |
| `hostMessage` | rich text | ~600 each | **Keep** as Basic Information | This is `Conversation.description`. Possibly worth splitting into Who / What / Why |
| `aboutConversation` | string[] | ~400 each | **Remove** | Folded into Basic Information |
| `campaignPageDescription` | string | ~300 | **Remove** | |
| `campaignPageHosts` | string, HTML | ~300 | **Remove** | Generated from the CoHosts list |
| `whatsNext` | string | ~300 | **Keep** as the Open Poll ending message | `Conversation.thankYouMessage` |
| `goDeeper` | string, HTML | ~300 | **Remove** | |
| `endCtaJoinDescription` | string | ~100 | **Remove** | Standardize across Campaigns |
| `endCtaShareDescription` | string | ~100 | **Remove** | Standardize across Campaigns |
| `polis_workflow_step_id` | UUID | 36 | **Move?** | Resolved from the workflow, see ADR 0004 |
| `faq` | shared constant | | Undecided | `Conversation.faqs` exists with no editor. #352 is still deciding how FAQs are used |
| `shareUrl` | url | ~50 | **Keep**, but derived | Should be base URL plus slug rather than a stored string |

### Not covered

Four fields on `RegionConfig` have no disposition yet. They are all newer than
the copy fields above and none of them is landing-page prose:

| Field | Type | What it is |
| --- | --- | --- |
| `events` | `ConversationEvent[]` | Upcoming live conversations. Admin already reads these from `GET /conversation/:id/events`, so this one is closest to being derivable |
| `conversationsActive` | boolean | Whether live conversations are open for registration |
| `phaseLabels` | `{phase1, phase2, phase3}` | Date labels for the three campaign phases |
| `fullHosts` | string | Dead. Set in the two dev region configs and read nowhere. Deletable now, independently of any of this |

## What has to happen before a field can go

1. A backend field to hold it, or a rule that derives it.
2. An editor in admin, otherwise the field ships dead. `thankYouMessage`,
   `callToAction` and `faqs` are all in this state today: they exist on the
   Conversation model and nothing in admin can write them.
3. The live Utah and Oregon values saved into their Conversation records. Until
   that is done by hand, removing the `regions.ts` entry removes the copy from
   a live site.
4. The `?? region.X` fallback dropped, and the entry deleted.

## Open questions

- `zipPrefixes` and `faq` have no disposition yet.
- `demonym` is the awkward one. It is interpolated into copy that is itself
  being removed, so it may disappear on its own once `heroBlurb` and
  `contextParagraphs` go. Worth checking rather than assuming.
- `Conversation.callToAction` exists and nothing uses it. #398's original table
  mapped the Context section to it, but admin writes `description`, so
  `callToAction` is currently unclaimed.
- Whether the Open Poll ending message stays a separate field or merges into
  Basic Information. The table keeps it separate, which is what #398 built.

Related: ADR 0003 (freeze scope), ADR 0004 (admin conversation resolution),
ADR 0006 (Place on metadata), ADR 0007 (URL scheme), #349, #351, #398, #366,
#414.
