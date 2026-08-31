# Admin resolves Conversations from the backend, with legacy region slugs as aliases

The admin app's Campaign list comes from comhairle
(`GET /user/permitted_conversations`), not from the static `REGIONS` map. The
`/c/<slug>` routes resolve against that same list. `regions.ts` survives in admin
only as an overlay for the handful of fields the Conversation model has nowhere
to put yet.

## Why this needed writing down

#397 decided the dashboard should render from `GetPermittedConversations` so a
Host member sees only their organization's Campaigns. #401 then found the two
halves did not meet: the backend hands back Conversations, and the router needed
a `regions.ts` key. It left four questions open. This records how they were
answered.

## Decision

**Route slug.** A Conversation routes under its legacy region's slug when one
exists, otherwise under the backend `slug`, otherwise its id. Legacy wins so
`/c/utah` and `/c/oregon` keep resolving. Lookups also accept the backend slug
and the raw id as aliases, so a link built from either identifier still lands.
The rule lives in one module, `packages/admin/src/lib/conversations.ts`, so the
forward mapping and the reverse lookup cannot drift apart.

**The permitted list is the access check, not just the lookup.** A Campaign the
caller's Host has no role on is absent from the list, so typing its URL 404s the
same way an unknown slug does. That closes the "hiding the card is not the guard"
half of #397. If the list call itself fails it is empty, which fails closed.

**Polis ids come from the backend.** Verified against a local comhairle:
`/conversation/:id/workflow/:workflow_id/workflow_step` returns the Polis step
with its id and a `toolConfig.poll_id`, which are exactly `regions.ts`'s
`polis_workflow_step_id` and `polisId`. This answers Q1.3 in
`packages/admin/OPEN_QUESTIONS.md`: they do not need a home on the Conversation
model. Campaigns with no region entry resolve theirs from the workflow.

Legacy regions still use their configured `polis_workflow_step_id` rather than
the resolved one, so existing deployments are untouched. Once the configured ids
are confirmed to match what the workflow reports, that branch goes.

## What `regions.ts` still supplies to admin

Three fields, all on the `campaign` object built in
`routes/c/[slug]/+layout.server.ts`, all empty for Campaigns with no region
entry:

- `shareUrl`, the public participant URL. Nothing on the Conversation carries it.
- `keyQuestion`, shown on Setup.
- `zipPrefixes`, which scope the participants county rollup.

`hostName` no longer comes from there: it is resolved from the owning
organization (`Conversation.organizationId` -> `GetOrganization`), with the
static value as a fallback for when the org is not readable.

## Consequences

- Admin sees whatever comhairle says it may see. Against a backend missing the
  Utah or Oregon conversation (a local dev database, say), `/c/utah` 404s. That
  is correct: the list is the source of truth, and the old behaviour was showing
  cards for Campaigns the backend had never heard of.
- Two extra requests per `/c/<slug>` page load: the workflow chain for Campaigns
  without a region entry, and `GetOrganization` for the Host name. Both are in
  the layout, so they are paid once per Campaign rather than per tab.
- `civicos` is unaffected and still reads `regions.ts` for everything. Only the
  admin dashboard moved (#397, scope note).
- The `dev` region overlay (`PUBLIC_DEV_*`) still works: it keys off
  `PUBLIC_DEV_CONVERSATION_ID`, so whichever backend Conversation that names is
  the one that routes at `/c/dev`.
- #349's URL scheme question is narrowed, not closed. Nothing here guarantees
  the backend `slug` is unique or stable across a rename; a rename that changes
  the slug changes the URL for Campaigns that have no region entry.
