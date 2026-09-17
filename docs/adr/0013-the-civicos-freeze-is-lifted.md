# The civicos freeze is lifted

`civicos` components can be changed like any other code in this repo. The rule
that only token-driven changes were allowed is gone, and so are ADRs 0003 and
0009, which existed only to carve exceptions out of it.

## Why this needed writing down

The freeze was written when nobody was working in `civicos` and the worry was a
shared primitive being restyled underneath it unnoticed. That stopped being the
situation. Of the last twenty commits on `stage`, 23 file changes are in
`packages/civicos`, and three ADRs in a row had to argue their way past the
freeze before doing ordinary work:

- 0003 carved out data loading, because the freeze read as "civicos may fetch a
  Host's configuration but not render it".
- 0005 carved out sanitizing Host copy, because a security fix touches a render
  site.
- 0009 carved out showing and hiding route-local elements on a Host switch.
- 0010 changed every gradient in the app to a flat colour and spent a section
  explaining why that was allowed.

Four carve-outs is not a constraint, it is a tax. Each one cost a round of
argument to reach a conclusion nobody disagreed with.

The change that prompted this is smaller than any of them. `civicos` buttons had
no pressed state, so on a phone a tap produced no feedback until the next screen
painted. Fixing that is a visual change to a `civicos` component, which the
freeze forbade outright.

## What was actually worth protecting

One thing, and it survives: the shared files that `civicos` imports. `Card`,
`Badge`, `Link`, `MonoLabel`, `input`, `popover`, `form`, `carousel`, `command`
and `spinner` render in both apps, so a change to one of them lands in `admin`
and `civicos` at once and it is easy to check only the app you had open. That
rule now lives in `docs/component-strategy.md` as a check-both-apps
requirement, which is what it always meant.

## Decision

- `civicos` components are editable. No token-only restriction, no carve-out
  needed.
- Changing a shared primitive still means verifying both apps render acceptably.
- The `civicos`-onto-shared migration in `component-strategy.md` stays parked.
  It is parked because step 4 needs a variant vocabulary both apps agree on, not
  because `civicos` is untouchable.

## Consequences

- 0003 and 0009 are deleted rather than left as tombstones. Both were arguments
  about the boundary of a rule that no longer exists, and neither held anything
  else. 0005 and 0010 each lose the section that argued past the freeze; the
  rest of both ADRs is unaffected, because sanitizing Host copy and flattening
  the gradients were correct on their own merits.
- 0009's one surviving fact moves to `component-strategy.md`: the definitions a
  Host configures live in `packages/shared/src/data/`, so `admin` and `civicos`
  read one list.
- The parked migration's guardrails still hold: shared components reference role
  tokens only, and a new shared primitive has to render in both apps.
