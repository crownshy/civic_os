# Civic OS

SvelteKit frontend. Talks to **Comhairle** (Rust backend) for users/invites, embeds **Polis** for the actual voting.

Setup in 5 min → [QUICKSTART.md](QUICKSTART.md).

## You need backend

Browser → SvelteKit `/api/[...path]` proxy → Comhairle (`:3000` local, `bloom.comhairle.scot` prod). Proxy lives at `src/routes/api/[...path]/+server.ts`. Keeps everything same-origin so Safari iOS cookies survive — do not bypass.

Two ways to get a backend:
- **Staging**: `API_URL=https://bloom.comhairle.scot`, `API_PREFIX=/api` in `.env`. Easy. Default-ish.
- **Local**: run `comhairle` repo (`just pg` + `just api-dev` + `just seed`), then `./scripts/seed-dev.sh` here. See QUICKSTART.

## Env

Only `.env` knob that matters day-to-day:

```env
API_URL=http://localhost:3000        # or staging url
# API_PREFIX=/api                    # staging only
```

Optional `PUBLIC_DEV_*` (4 ids from seed script) → unlocks `dev` region. Everything else (per-region conversation/invite/polis ids, copy, slides) lives in **`src/lib/config/regions.ts`** — not env.

## Auth

No login UI. On JOIN the frontend:

1. `SignupAnnonUser` → creates anonymous user on Comhairle, gets `auth-token` cookie.
2. `AcceptInvite` → registers that user against the region's `conversationId` + `inviteId`.
3. Saves zipcode (`saveProfile`).
4. If email given → `RegisterEmailForUpdates`.

See `src/lib/services/session.svelte.ts`. Cookie is httpOnly, set by backend through the proxy.

## Regions + Polis redirect

Region picked in two stages:

1. **Subdomain** → page chrome (host name, slides, question). `utah.localhost` = utah, `oregon.localhost` = oregon, bare `localhost` = `dev` if `PUBLIC_DEV_*` set else `all` (generic). Logic: `extractSubdomain` + `getRegionBySubdomain` in `src/lib/config/regions.ts`.
2. **Zipcode at JOIN** → which Polis you actually vote on. `84xxx → utah`, `97xxx → oregon`, else generic. If zip-region ≠ host-region, browser redirects to that region's subdomain before registering.

**Local override**: when `PUBLIC_DEV_*` set, landing forces `dev` region — any zip, any subdomain lands on your seeded poll. No accidental hits on shared staging Polis.

⚠️ Region ids are **hardcoded in `regions.ts` for now** we're still developing. Per-environment overrides via env vars is a TODO. Editing `regions.ts` = changing live deploys, so for local play use the `dev` region or the `testing` region.

## api-client

`@crownshy/api-client` = TypeScript client generated from the backend's `open-api-spec.json`. Lives at `comhairle/ui/packages/api-client`. Consumed from npm by default (`package.json` pins a version).

**Use local copy when iterating on backend types**:

```sh
# in comhairle's api-client package
pnpm install && pnpm build && pnpm link --global

# back here
pnpm link --global @crownshy/api-client
```

Backend has `just api-watch` = cargo watch + spec rebuild. On change, Vite HMR picks up new types.

Undo: `pnpm unlink --global @crownshy/api-client && pnpm install`.

## Day-to-day

| cmd | does |
|---|---|
| `pnpm dev` | dev server :5173 |
| `pnpm build` / `pnpm preview` | prod build + serve |
| `pnpm check` | svelte-check |
| `pnpm lint` / `pnpm format` | prettier + eslint |
| `pnpm test:unit` | vitest |
| `pnpm test:e2e` | playwright |
| `pnpm test` | both |
| `pnpm storybook` | storybook :6006 |

## Important things to know

- All browser API calls go through `/api/[...path]`. Safari iOS will eat your cookies if you bypass it.
- **Region ids hardcoded** in `regions.ts`. Don't edit utah/oregon ids unless you mean to change prod. Use `dev` or `testing` region.
- **`PUBLIC_*` vars** are baked at build time.
- **api-client lags backend.** If types don't match, either bump the published package or use `pnpm link` workflow above.

## Troubleshooting

- `fetch failed` everywhere → backend down or `API_URL` wrong. `curl $API_URL/health`.
- Polis empty → check `polisId` in region config maps to a real conversation on `polis.comhairle.scot`.
- `dev` region missing → `PUBLIC_DEV_*` not set or `pnpm dev` was started before seed wrote env. Restart.

## Map

```
src/
├── routes/
│   ├── api/[...path]/+server.ts    proxy → comhairle
│   ├── landing/                    region landing + zip redirect
│   ├── contribute/                 polis voting
│   └── about-you/ profile/ learn/ report/ deliberation/ campaign/
└── lib/
    ├── config/regions.ts           region ids + copy (hardcoded for now)
    ├── services/
    │   ├── api.ts                  api client factory
    │   ├── session.svelte.ts       anon signup + invite + email
    │   └── polis-api.svelte.ts     polis voting
    └── components/ paraglide/ types/ data/
```
