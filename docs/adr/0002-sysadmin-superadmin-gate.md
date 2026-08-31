# Super-user surfaces gate on canCreateOrganization, not the binary admin gate

BLOOM staff tools (creating Hosts and Places) live under a new `/sysadmin` route
area in the admin app, gated on `GetUserOrganizations.canCreateOrganization`, the
backend's own computed capability flag. This is deliberately narrower than the
app's existing binary `isAdmin` gate, which only proves the caller has some admin
access to comhairle, not that they may create organizations.

## Context

The admin app authorizes every route through one boolean: `hooks.server.ts` probes
`GET /regions` and sets `locals.isAdmin`. The first super-user-only feature (Create
Host, #382) forced the question of how the frontend should represent "may create a
Host." Two comhairle facts shaped the answer, both non-obvious:

- `GetUserRoles` looks like the right source, but that handler is **currently a
  stub**: it returns `{ resource: "Site", roles: ["Admin"] }` for any admin and
  **never reports `SuperAdmin`**. Gating on it would never let anyone in.
- `Action::OrganizationCreate` is in **no role's action list** (not even
  `SuperAdmin`'s). The only path that authorizes it is the SuperAdmin *bypass* in
  `can_perform_resource_action`. So `canCreateOrganization` is effectively "is a
  Site super-admin," surfaced directly as a boolean on `GET /user/organizations`.

## Considered Options

- **Reuse the binary `isAdmin` gate.** Rejected as the primary guard: it would show
  super-user-only UI to every regional admin, leaking tools they cannot use. (Note
  the org-create *route* itself only requires `RequiredAdminUser` today, so a plain
  admin can currently create via the API; the capability flag is stricter. We gate
  on the stricter, intended signal.)
- **Gate on `GetUserRoles` Site+SuperAdmin.** Rejected: the handler is a stub that
  never returns SuperAdmin, so the gate would never pass.
- **Gate on `GetUserOrganizations.canCreateOrganization`.** Chosen. It is the
  backend's own answer to "may this user create an organization," one typed call,
  computed server-side. The frontend reads it once in a layout `load`, hides the
  `/sysadmin` nav, and guards the routes server-side.

## Consequences

- `/sysadmin` becomes the home for the Sysadmin Permissions Dashboard (#372):
  create Hosts now, Places (#351) and users next, behind the same `canCreateHost`.
- The admin app now has two authorization tiers: `isAdmin` (any admin, existing
  routes) and `canCreateHost` (`/sysadmin`). A future reader should not collapse
  them; they are different capabilities.
- A user gains `canCreateHost` only by holding a `system` / `super_admin` row in
  comhairle's `resource_permissions` (see the dev-seed note below). If comhairle
  later adds `OrganizationCreate` to a role's `actions()`, the flag broadens
  accordingly with no frontend change.
- Two backend follow-ups this surfaced: `get_user_roles` should report real roles
  (not the `Admin`-only stub), and the org-create route guard (`RequiredAdminUser`)
  is looser than `canCreateOrganization` (SuperAdmin bypass) — those two should be
  reconciled so the route and the flag agree.
