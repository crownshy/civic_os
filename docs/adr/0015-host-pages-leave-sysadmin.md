# Host pages leave /sysadmin

The Host pages move from `/sysadmin/hosts` to `/hosts`, and Host admins can now
reach them. ADR 0002 put them behind the Super user gate; this narrows that gate
to the one Host action that needs it. Decided in #454, and it settles where the
Host edit form from #450 lives.

| Who | Sidebar link | `/hosts` list | `/hosts/[id]` |
| --- | --- | --- | --- |
| Super user | "Hosts", to the list | Every Host, plus Create Host | Every Host: details, team, Campaigns |
| Admin of one Host | "My Host", straight to it | Their Host | Their Host: details and team |
| Member of one Host | None | Their Host | Their Host, read only |
| Anyone in more than one Host | "My Hosts", to the list | Their Hosts | Per Host, by their role there |

Creating a Host (`/hosts/new`) and assigning or revoking a Campaign on a Host
page stay Super user only. Assigning hands one Host's work to another and cannot
be undone (see the note on `assignCampaign`), so a Host admin does not get it.

## Why

A Host admin manages their team and their Host's details, and the only page for
that was behind a gate they could not pass. Loosening the `/sysadmin` gate would
have kept the pages but made the name lie, so the pages moved instead and
`/sysadmin` stays reserved for staff tools (Places and users, #372).

A member of a single Host gets no link: the list would have one row, and there is
nothing on that Host's page they can change. They can still open the page by URL.

## How it is enforced

The root layout turns `GetUserOrganizations` into `hostAccess`
(`$lib/host-access.ts`): `all` for a Super user, otherwise the Hosts with
`isAssociated` and whether `canUpdate` (OrganizationAdmin) is set on each. The
`/hosts` layout bounces anyone with no Host, `/hosts/[id]` returns 404 for a Host
the caller cannot see, and every form action re-reads access itself, because
actions run without the layout loads. Comhairle checks each write as well.

`ListOrganizations` returns every Host to whoever asks, so the list page filters
it to the caller's Hosts. Comhairle keeps one organization per user today, so the
"more than one Host" rows are there for when it stops doing that.
