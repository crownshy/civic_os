# A Campaign's Areas ride on metadata, keyed by GEOID

A Host picks the states, counties and cities a Campaign runs in with the place
selector (#514). Until comhairle can link a Conversation to its Areas, the pick is
stored on `Conversation.metadata.areas` as a list of `{ geoid, level, name }`,
read and written through `packages/shared/src/data/areas.ts`.

This sits beside ADR 0008, it does not reverse it. `metadata.place` is still the
one Place a Campaign is listed under, still typed by the Host, and still what
scopes the slug. `areas` says where the Campaign runs; nothing on the participant
side reads it yet.

## Why not a Region now

#514 offered a `custom` Region per Campaign (option A) or a Conversation-to-Area
link (option B). Neither works yet:

- `/region_areas` is super-admin only, so a Host admin cannot list Areas to pick
  from (#561). `/regions` needs a system admin.
- The Areas themselves are not imported with a hierarchy. The tag convention is
  still open in #509, and a Census city file carries no county.
- Participants are anonymous and cannot read either endpoint, which is the reason
  a Place rides on metadata in the first place (ADR 0006).

## Why GEOID and not a comhairle id

A comhairle area id only exists once that area has been imported, and changes if
it is imported again. A Census GEOID (`41`, `41017`, `4105800`) is the same before
and after, and the importer already tags areas with the parts it is built from
(`statefp`, `countyfp`). Moving to a Region later is a lookup from GEOID to area,
not a migration of ids.

`name` is stored too, so the Identity card, the Host rows and civicos can show a
Campaign's areas without loading the place data.

## Where the place data comes from

`admin/src/lib/components/place-selector/sources.ts` is the one switch. It
returns seeded Oregon and Utah (`seed-places.ts`) for now. When #561 and #509
land, it returns a comhairle-backed source and the seed file is deleted. The
selector, the stored shape and this ADR stay.
