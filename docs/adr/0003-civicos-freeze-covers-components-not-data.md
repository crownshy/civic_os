# The civicos freeze covers components, not data

`docs/component-strategy.md` says "do not modify `civicos` at all" while the
civicos-onto-shared migration sits parked. That constraint is scoped to **shared
component markup**. It does not prevent `civicos` from reading its own
conversation from the Comhairle API.

## Why this needed writing down

Milestones 12 and 13 are premised on Hosts configuring their Campaign and their
Open Poll and having participants see the result. While scoping #354 we found
that `packages/civicos` never fetches a conversation. The landing page reads
`region.*` 18 times and calls no conversation endpoint, so every host-facing
string is hardcoded per region in `packages/shared/src/data/regions.ts`:

| Participant surface | Today | Backend field |
|---|---|---|
| "What's Next?" (landing + ThankYouScreen) | `region.whatsNext` | `thankYouMessage` |
| Landing "Context" section | `region.contextParagraphs` | `callToAction` |
| End-screen CTA copy | `region.endCtaJoinDescription`, `endCtaShareDescription` | none yet (#368) |
| FAQ | `region.faq` | `faqs` |

Read literally, the freeze makes those milestones impossible: admin would write
config that nothing ever reads. That is not what the freeze was for.

## What the freeze actually protects

The decision exists so that shared UI primitives are not restyled underneath
`civicos` while the migration is parked, and it names the files it protects:
`Card`, `Badge`, `Link`, `MonoLabel`, `input`, `popover`, `form`, `carousel`,
`command`, `spinner`. Adding a `GetConversation` call to a `load` function
touches none of them.

## Decision

- **Frozen:** the markup of the shared primitives listed above, and any change
  to `civicos` components that alters their rendering. Token-driven changes only,
  as before.
- **Not frozen:** `civicos` data loading. Adding `load` functions, fetching
  conversation data through the generated API client, and reading those values
  at existing call sites are all in scope.

## Consequences

- #398 can proceed: one `GetConversation` in `civicos/src/routes/+layout.ts`
  (with `depends()`), then `conversation.X ?? region.X` at the call sites. The
  `??` fallback keeps Utah and Oregon rendering exactly what they render today
  until a Host saves something.
- `regions.ts` becomes the default layer rather than the source of truth. It
  stays until every field it holds has a backend equivalent, so it cannot be
  deleted on this change.
- The parked migration in `component-strategy.md` is unaffected. Steps 2 to 4
  remain parked.
