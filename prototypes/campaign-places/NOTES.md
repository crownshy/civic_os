# Campaign ↔ Place: what the prototype is asking

**Throwaway.** Run `pnpm prototype:places`. Delete once the question below has an
answer, or lift `model.ts` into `campaign.ts` / `place.ts` if the shape survives.

## The question

The team has settled on "Campaigns and Places are many-to-many, and each Place
has its own poll" (hoctopi, 2026-08-28) without settling what that implies. This
prototype makes the shape concrete so the implications can be pressed on rather
than argued about:

> If Campaign ↔ Place is many-to-many and every pair is its own comhairle
> Conversation, what breaks, and what decisions does that force?

## The shape under test

**The join row is the poll.** Not a link table plus a poll: the same row.

```
Campaign ──┐
           ├── (campaign, place) = 1 comhairle Conversation + 1 Polis step
Place    ──┘                       owned by that place's Host
```

Which means:
- A Campaign is the shared identity: slug, title, default question, seed statements.
- A Place is the subdomain, and nothing more today (see "polygons" below).
- Adding a Place to a Campaign **creates a poll**. There is no other way one appears.
- URL: `<place>.bloomproject.us/<campaign-slug>` → exactly one poll, or nothing.

hoctopi's fallback (17:11, "place ↔ campaign 1:1 but many campaigns linked by a
template") is **the same graph**. It only moves where identity lives: in a
Campaign entity, or in a template that campaigns point at. The pressure points
below are identical either way, which is worth knowing before the meeting.

## What the prototype showed

Seeded with Utah / Oregon / catch-all as they actually ran.

1. **A campaign-level edit reaches zero polls.** All three localised their
   question (Utahns / Central Oregonians / Americans), so "edits to a campaign
   affect all polls" is a no-op on the only engagement we have run. Propagation
   needs a defaults-with-override rule, not a broadcast, and someone has to
   decide what happens to a poll that has already overridden a field.
2. **No single Host can edit a campaign.** comhairle gives a Conversation exactly
   one `organizationId`, and these three have three different ones. Acting as
   Utah Common Ground, an edit is blocked on `ai@oregon` and `ai@all`. Only a
   BLOOM super user can touch all of them, so "campaign edit" is a super-user
   feature unless comhairle grows cross-org campaign permissions.
3. **Two campaigns in one Place makes the Place root undecidable.** With one,
   `utah.bloomproject.us/` redirects to `/ai`. With two it can only render an
   index, and no such page exists (`+page.ts` redirects to a single configured
   slug; ADR 0006 notes there is no index of a Place's Campaigns). George's
   landing-page question is not optional under many-to-many, it is forced.
4. **The corrective 404 stops working.** `+error.svelte` offers a single
   "GO TO OREGON" button. A campaign in three places has no single correct
   elsewhere. Either the error page lists places, or it degrades to a plain 404.
5. **Unlinking a Place orphans a deliberation.** Dropping `ai@oregon` drops 380
   votes and a live Polis conversation. A link-table row deletes cleanly; this
   does not. Unlink needs to mean archive, not delete.

## Scenarios to evaluate options against

Use these as the test set. An option is only better if it answers all five.

| # | Scenario | Why it discriminates |
|---|---|---|
| S1 | One campaign, three places, three Hosts (Utah today) | Baseline. Any option must express what already shipped. |
| S2 | Two campaigns live in one place | Forces the Place index page, or forbids the case. |
| S3 | Host edits shared copy for their place only | Tests defaults vs override, and per-org write permission. |
| S4 | BLOOM edits the campaign for everyone | Tests cross-org propagation and who is allowed to do it. |
| S5 | A place leaves a campaign mid-engagement | Tests archive-vs-delete and what happens to the report. |

## Still open, and not modelled here

- **Places as polygons.** hoctopi raised real jurisdictions, possibly shown to
  participants. Today a Place is `{ slug, name }` on conversation metadata
  (ADR 0006). Geometry changes what a Place *is*, and probably means it stops
  being metadata and becomes a comhairle Region after all.
- **Cross-place analysis.** Separate Polis conversations mean separate opinion
  groups. "Weight responses from the user's place" or "cross-pollinate between
  polls" (hoctopi) are not expressible with one Polis conversation per pair.
- **Admin's list of valid subdomains** (George). `placesOf()` in `model.ts` is
  the query; there is nowhere to render it yet.
- **Slug uniqueness.** comhairle is moving to slug-unique-per-org. Two places
  under the *same* Host still collide, which is why `oregon` had to be
  `ai-and-communities-dundee`-style in ADR 0007.

## Verdict (2026-08-28, Daniela)

**Deferred. One Campaign, one Place, one poll for now — see ADR 0008.**

Findings 1 to 4 are unanswered and every version of many-to-many needs comhairle
to move first, so the narrow rule is documented rather than guessed at. This file
and `model.ts` are the working material for the session that reopens it; the
model is written to be lifted, not re-derived.

What follows is what was decided before the deferral, and still holds.

Many-to-many is the model **for new Campaigns**. Utah and Oregon stay as they
are; the legacy `regions.ts` path in `campaignCandidates()` keeps them resolving.

Three decisions landed off the back of the findings above:

1. **No corrective 404.** Finding 4 stands: a Campaign in several Places has no
   single right elsewhere. `App.Error.elsewhere`, the "GO TO OREGON" button and
   `urlForPlace()` are deleted. Plain 404. (ADR 0007)
2. **Conversation slugs are scoped to the Place**, `<campaign>-<place>`, derived
   automatically. Public URL unchanged. This was the cheap fix: `<place>/<slug>`
   now narrows to one Conversation through the existing public
   `GET /conversation/:idOrSlug`, so the "we need a campaign entity before
   anything works" blocker is gone. (ADR 0007)
3. Findings 1, 2, 3 and 5 are **still open** and are what the team session is
   for. Nothing has been built that depends on an answer to them.

Not yet done, in rough priority order:

- **The Place index page** (finding 3). Forced as soon as a second Campaign runs
  in a Place. `campaignsIn()` is the query.
- **Propagation rules** (findings 1 and 2). Needs the defaults-vs-override
  decision and a cross-org permission answer from comhairle.
- **Archive on unlink** (finding 5).
- **Admin grouping.** Now unblocked: group the conversation list by
  `campaignSlugFrom(slug, placeSlugs)`. `GetPermittedConversations` returns
  `metadata`, so each row's Place is readable without a per-Campaign fetch; what
  is still missing is a registry of Places to match suffixes against.

Done since: Setup rescopes the Conversation slug when the Place is saved
(`rescopedSlug()`), legacy regions exempt. Creating a *sibling* Conversation for
a second Place is still the missing action, and it is the one that needs the
propagation and ownership answers first.
