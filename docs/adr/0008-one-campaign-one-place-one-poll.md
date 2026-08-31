# One Campaign, one Place, one Poll

A Campaign runs in exactly one Place and has exactly one poll. The three are
1:1:1, and `Conversation.metadata.place` holds a single Place object, not a list.

This is a deliberate narrowing, not the end state. The team has agreed Campaigns
and Places are **many-to-many** in principle (hoctopi, 2026-08-28) and that each
Place gets its own poll. What has not been agreed is anything needed to build it,
and comhairle has no support for it at all. So the frontend states the narrow
rule out loud rather than shipping a UI that implies the wide one.

## Why not build many-to-many now

`prototypes/campaign-places/` models it and drives it against the real Utah /
Oregon / catch-all data. Five things came out, and four are unanswered:

1. **A campaign-level edit reaches zero polls.** All three localised their
   question (Utahns / Central Oregonians / Americans), so "edits to a Campaign
   affect all its polls" is a no-op on the only engagement we have run. It needs
   a defaults-versus-override rule that nobody has written.
2. **No single Host can edit a Campaign.** comhairle gives a Conversation exactly
   one `organizationId`, and those three polls have three different ones. Editing
   across them is a super-user action, or needs cross-org Campaign permissions
   that do not exist.
3. **Two Campaigns in one Place makes the Place root undecidable**, forcing an
   index page that has no design.
4. **Unlinking a Place orphans a live deliberation** (380 votes on `ai@oregon`).
   Unlink has to mean archive, and there is no archive.
5. Resolved: slug collisions, see ADR 0007.

Backend support is the binding constraint. There is no Campaign entity and
nothing links sibling Conversations, so every version of many-to-many needs
comhairle to move first.

(An earlier draft also claimed the conversation list returns no `metadata`. It
does: `GetPermittedConversations` answers `LocalizedConversationDto`, which
includes `metadata`. So grouping siblings by `campaignSlugFrom()` and rendering a
per-Campaign Place are both possible from the list today. That removes one
obstacle; it does not remove the four above.)

## What the narrow rule buys

- `metadata.place` stays a single object, so `readPlace()` and every civicos read
  keep working unchanged (ADR 0006).
- `<place>.bloomproject.us/<campaign>` resolves to one Conversation with no
  ambiguity, through the existing public `GET /conversation/:idOrSlug`.
- A Place root has exactly one Campaign to redirect to, so no index page.
- Setup edits one poll, which is the only poll, so propagation does not arise.

## What it costs, and what stays anyway

The Setup field is a single Place, not a multiselect. A Host who wants the same
Campaign in two Places creates two Campaigns, which is what Utah and Oregon
already are.

Two things built for many-to-many are **kept deliberately**, because they cost
nothing now and are the parts that would otherwise have to be retrofitted:

- **Place-scoped Conversation slugs** (`ai-utah`, ADR 0007). Not needed for
  disambiguation under 1:1, but it makes uniqueness automatic instead of the
  Host's problem, and it is exactly the key a sibling poll would need.
- **No corrective 404.** Removed because a Campaign in several Places has no
  single right elsewhere. Under 1:1 that link would be expressible again; it
  stays out because it is less code and it becomes wrong the moment the wider
  model lands.

## When to revisit

Any one of these reopens it: comhairle gains a Campaign entity or a group field
on Conversation; a real engagement needs one question across two Places under one
Host; or the team answers findings 1 to 4 above. The prototype and its NOTES.md
are the working material for that session, and the model in `model.ts` is written
to be lifted rather than re-derived.

Related: ADR 0006 (Place on metadata), ADR 0007 (slug scheme and slug scoping),
`prototypes/campaign-places/NOTES.md`, #349, #351.
