# Civic OS

SvelteKit frontend. Talks to **Comhairle** (Rust backend) for users/invites/events, embeds **Polis** for the actual voting.

Setup in 5 min → [QUICKSTART.md](QUICKSTART.md).

## Monorepo

pnpm workspace, Node 22.12, pnpm 9.15. Three packages under `packages/`:

| package | name | what |
|---|---|---|
| `packages/civicos` | `civic-os` | public participant app (the bulk). Dev :5173 |
| `packages/admin` | `@civicos/admin` | organizer dashboard — conversations, events, reports. Dev :5174 |
| `packages/shared` | `@civicos/shared` | `workspace:*` dep — region data, shared UI primitives, types, theme. Imported via subpath exports (`@civicos/shared/data/regions`, `@civicos/shared/ui/button`); no build step, exports point at source |

Most paths below live in `packages/civicos/`. Region data is the notable shared bit: pure data lives in `packages/shared/src/data/regions.ts` and is re-exported (with the env-built `dev` region added) through `packages/civicos/src/lib/config/regions.ts`.

## You need backend

Browser → SvelteKit `/api/[...path]` proxy → Comhairle (`:3000` local, `bloom.comhairle.scot` prod). Proxy lives at `packages/civicos/src/routes/api/[...path]/+server.ts` (admin has its own near-identical copy). Keeps everything same-origin so Safari iOS cookies survive — do not bypass.

Two ways to get a backend:
- **Staging**: `API_URL=https://bloom.comhairle.scot`, `API_PREFIX=/api` in `.env`. Easy. Default-ish.
- **Local**: run `comhairle` repo (`just pg` + `just api-dev` + `just seed`), then `packages/civicos/scripts/seed-dev.sh` here. See QUICKSTART.

## Env

Lives at `packages/civicos/.env` (copy from `packages/civicos/.env.example`). Only knob that matters day-to-day:

```env
API_URL=http://localhost:3000        # or staging url
# API_PREFIX=/api                    # staging only
```

Optional `PUBLIC_DEV_*` (4 ids from seed script) → unlocks `dev` region. Everything else (per-region conversation/invite/polis ids, copy, slides) lives in **`packages/civicos/src/lib/config/regions.ts`** (and `@civicos/shared`) — not env.

## Auth

No login UI. On JOIN the frontend:

1. `SignupAnnonUser` → creates anonymous user on Comhairle, gets `auth-token` cookie.
2. `AcceptInvite` → registers that user against the region's `conversationId` + `inviteId`.
3. Saves zipcode (`saveProfile`).
4. If email given → `RegisterEmailForUpdates`.

See `packages/civicos/src/lib/services/session.svelte.ts` — a Svelte 5 runes (`$state`) class exported as a singleton. Non-sensitive flow state (userId, zip, Polis `pid`, vote count, which screens were seen) is mirrored to `localStorage` under `civic-os-session`; the auth token itself stays in the httpOnly cookie, set by the backend through the proxy.

## Regions + Polis redirect

Region picked in two stages:

1. **Subdomain** → page chrome (host name, slides, question). `utah.localhost` = utah, `oregon.localhost` = oregon, bare `localhost` = `dev` if `PUBLIC_DEV_*` set else generic. Logic: `extractSubdomain` + `getRegionBySubdomain`, resolved in `hooks.server.ts` onto `event.locals.region`.
2. **Zipcode at JOIN** → which Polis you actually vote on. `84xxx → utah`, `97xxx → oregon`, else generic. If zip-region ≠ host-region, browser redirects to that region's subdomain before registering.

**Local override**: when `PUBLIC_DEV_*` set, landing forces `dev` region — any zip, any subdomain lands on your seeded poll. No accidental hits on shared staging Polis.

⚠️ Region ids are **hardcoded in `regions.ts` for now** — we're still developing. Per-environment overrides via env vars is a TODO. Editing region ids = changing live deploys, so for local play use the `dev` region or the `testing` region.

## api-client

`@crownshy/api-client` = TypeScript client generated from the backend's `open-api-spec.json`. Lives at `comhairle/ui/packages/api-client`. Consumed from npm by default (`packages/civicos/package.json` pins a version). `vite.config.ts` carries a small shim (`fixApiClientPlugin`) for the client's ESM resolution — leave it.

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

Run from the repo root. Root scripts fan out via `pnpm --filter`:

| cmd | does |
|---|---|
| `pnpm dev` | civicos dev server :5173 |
| `pnpm dev:admin` | admin dev server :5174 |
| `pnpm build` | build all packages (`pnpm -r build`) |
| `pnpm check` | svelte-check across packages |
| `pnpm lint` / `pnpm format` | prettier + eslint (civicos) |

Civicos-only scripts aren't surfaced at root — run with `pnpm --filter civic-os <script>` (or from inside `packages/civicos`):

| cmd | does |
|---|---|
| `pnpm --filter civic-os preview` | serve prod build |
| `pnpm --filter civic-os test:unit` | vitest (browser-mode + Storybook story tests) |
| `pnpm --filter civic-os test:e2e` | playwright |
| `pnpm --filter civic-os test` | unit then e2e |
| `pnpm --filter civic-os storybook` | storybook :6006 |

Single unit test: `pnpm --filter civic-os test:unit -- --run path/to/file.spec.ts` (or `-t "name"` to filter).

## Deploy

Pushes to `stage`/`main` (and `v*` tags) trigger `.github/workflows/docker-image.yml`: it builds Docker images (`Dockerfile` for civicos, `Dockerfile.admin` for admin), pushes to Docker Hub, and updates the image tags in the `crownshy/bloom_charts` GitOps repo. The civicos Dockerfile uses `pnpm deploy --prod` to produce a self-contained output that resolves the `@civicos/shared` workspace dep.

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
packages/
├── civicos/                            public participant app (civic-os)
│   ├── scripts/seed-dev.sh             mints local dev region ids → .env
│   └── src/
│       ├── hooks.server.ts             subdomain → locals.region (+ paraglide)
│       ├── routes/
│       │   ├── api/[...path]/+server.ts    proxy → comhairle
│       │   ├── landing/                    region landing + zip redirect
│       │   ├── contribute/                 polis voting flow
│       │   └── conversations/ report/ campaign/ ...
│       └── lib/
│           ├── config/regions.ts       region facade (+ env-built dev region)
│           ├── services/
│           │   ├── api.ts              api client factory
│           │   ├── session.svelte.ts   anon signup + invite + email (runes singleton)
│           │   └── polis-api.svelte.ts polis voting
│           └── components/ paraglide/ types/ data/
├── admin/                              organizer dashboard (@civicos/admin)
└── shared/                             @civicos/shared
    └── src/data/regions.ts             pure region data (single source of truth)
```
