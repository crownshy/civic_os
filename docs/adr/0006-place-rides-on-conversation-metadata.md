# A Place rides on Conversation metadata, not the Region API

The public URL is heading for `<place>.bloomproject.us/<campaign-slug>`. A Place
is therefore load bearing: it is the subdomain, and it is the "Place(s)" chip
admin already renders on the Setup Identity card. Comhairle has a Region model
that looks like the right home for it and is not, so civicos reads a Place from
`Conversation.metadata.place` instead, behind
`packages/civicos/src/lib/config/place.ts`.

## Why not the Region API

`/regions` and `/region_areas` exist, with `RegionType` (`custom` | `official`),
zip-prefix areas, and many-to-many region-area links. Three things stop them
backing a Place today:

1. **Nothing links a Conversation to a Region.** `LocalizedConversationDto`,
   `CreateConversation` and `PartialConversation` all lack a region field. There
   is no way to ask which Place a Campaign belongs to, or to list the Campaigns
   in one. `Organization.regions` and `Workflow.regionId` exist; the Conversation
   equivalent does not.
2. **A Region has no URL-safe slug.** It has `name`, `description` and
   `official_id`. A subdomain needs a slug, and `official_id` means the official
   geographic identifier, not a route segment.
3. **Both endpoints require auth.** They answer `401 User required for this
   route` anonymously. The participant app resolves the subdomain before anyone
   has logged in, so it cannot read them at all.

`GET /conversation/:idOrSlug` has none of those problems: it is public, it
accepts the slug directly, and it returns `metadata` in the anonymous response.

## What this costs

A Place is not a record. Two Campaigns in the same Place duplicate the name and
can disagree about it, and nothing enumerates Places, so "add a Place" means
"write the same object onto another Conversation". That is acceptable while a
deployment serves one Campaign per subdomain, and stops being acceptable the
moment a Place needs to list its Campaigns.

`PatchConversationMetadata` merges at the top level and replaces nested objects
wholesale, so `place` is always written as a complete object. It is a sibling of
`demographics` and `customDemographics`, which are unaffected by a place write.

## Who writes it

Admin's Setup Identity card owns the write (`overview/+page.svelte`), through the
same `PatchConversationMetadata` path as `demographics` and `participantAsks`.
The Host types a **name**; the slug is derived from it by `toPlaceSlug()` and
never typed, because it is a DNS label and a hand-typed one would drift from the
name it is supposed to stand for.

Two consequences worth stating out loud:

- **Renaming a Place moves its subdomain.** The card renders the resulting
  address under the field so that is visible before it is saved, but the label
  still has to exist in the ingress for the new address to resolve (#351). This
  supersedes the earlier "Places are provisioned by BLOOM, not edited here" note
  on that card: the *name* is now edited by the Host, the *DNS* is still
  provisioned.
- **Clearing the field is an action, not a no-op.** It writes `place: null`, and
  a Campaign with no Place 404s in civicos (ADR 0007).

`readPlace()` and the slug rules live in `@civicos/shared/data/place`, imported
by both apps, so the surface that writes a Place and the surface that serves
from it cannot disagree about the shape.

## The way out

Every read and write goes through `@civicos/shared/data/place`, so the swap is a
change to that one module once the backend has: a region reference on the Conversation, a
slug on the Region, and an anonymous read for both. Until then, treat
`metadata.place` as the contract; `scripts/seed-dev.sh` writes it for local
development.

Related: ADR 0003 (freeze scope), ADR 0004 (admin conversation resolution),
`docs/regions-migration.md`, #349 (URL scheme), #351 (Places provisioned by
BLOOM).
