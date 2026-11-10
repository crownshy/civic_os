# Civic OS

SvelteKit frontends for The Bloom Project. Talks to **Comhairle** (Rust backend) for users, Conversations and events, embeds **Polis** for the actual voting.

Setup in 5 min → [QUICKSTART.md](QUICKSTART.md). How we build → [AGENTS.md](AGENTS.md) and [STYLE_GUIDE.md](STYLE_GUIDE.md). Domain words → [CONTEXT.md](CONTEXT.md).

## Packages

pnpm workspace, everything under `packages/`:

| package    | name              | what                                                                               | dev port |
| ---------- | ----------------- | ---------------------------------------------------------------------------------- | -------- |
| `civicos/` | `civic-os`        | participant app: Campaign pages, swipe voting, events, profile                     | 5173     |
| `admin/`   | `@civicos/admin`  | admin app: Hosts, Campaign setup, dashboards, moderation                           | 5174     |
| `report/`  | `@civicos/report` | standalone public report, deployed to `report.bloomproject.us`                     | 5175     |
| `shared/`  | `@civicos/shared` | shadcn-svelte primitives, theme tokens, `regions.ts`, zip data, API client factory | n/a      |

What goes in `shared` vs an app: [docs/component-strategy.md](docs/component-strategy.md).

## You need backend

Browser → SvelteKit `/api/[...path]` proxy → Comhairle (`:3000` local, `bloom.comhairle.scot` staging). `civicos` and `admin` each have their own proxy at `src/routes/api/[...path]/+server.ts`. Keeps everything same-origin so Safari iOS cookies survive, do not bypass.

The report does not call the backend. Its data is checked-in JSON under `packages/report/src/lib/data/`.

Two ways to get a backend:

- **Staging**: `API_URL=https://bloom.comhairle.scot`, `API_PREFIX=/api` in the package's `.env`. Easy.
- **Local**: run the `comhairle` repo (`just pg` + `just api-dev` + `just seed`), then `./scripts/seed-dev.sh` here. See QUICKSTART.

## Env

Each app has its own `.env` (copy `.env.example` in `packages/civicos` and `packages/admin`).

```env
API_URL=http://localhost:3000        # or staging url
# API_PREFIX=/api                    # staging only
```

Admin also wants `PUBLIC_PARTICIPANT_BASE_URL` (e.g. `localhost:5173`) to build Campaign share links. Civicos reads an optional `PUBLIC_POLIS_URL` (default `https://polis.comhairle.scot`). `PUBLIC_*` vars are baked in at build time.

The old `PUBLIC_DEV_*`, `PUBLIC_CONVERSATION_ID` and `PUBLIC_POLIS_ID` vars are gone. Campaigns come from the backend.

## Campaigns and URLs

The URL picks the Campaign: `/<conversation-slug>`, with the poll at `/<conversation-slug>/poll`, events at `/events` and the report at `/report` under it. Nothing is read from the hostname (ADR 0011, ADR 0014). A slug no Campaign has is a Place, whose Campaigns are listed at `/<place-slug>`. `/` is the directory of live Campaigns.

A Campaign is a stored Conversation. Its title, copy, FAQ, palette, demographics, asks and Polis id are set in admin and live on the Conversation and its `metadata` (see [docs/regions-migration.md](docs/regions-migration.md) for the full table). `packages/shared/src/data/regions.ts` is only the default layer behind that: the region that owns the Conversation, else the generic catch-all. Logic: `regionForCampaign` in `packages/civicos/src/lib/config/campaign.ts`.

Zip redirect only applies to the legacy Utah, Oregon and catch-all Campaigns: `84xxx → utah`, `97xxx → oregon`. If the zip's region ≠ the Campaign's, the browser goes to that region's Campaign before registering.

The root `/` of the old `utah.`, `oregon.`, `testing.` and `all.` hosts still opens their Campaign, because production serves those hosts. `/conversations` and `/[org]/conversations/…` 308 to the new URLs.

⚠️ `regions.ts` still holds the legacy Utah/Oregon ids. Editing those changes live deploys. For local play, seed your own Campaign.

## Auth

Participants (civicos) join from the Campaign's join sheet, one of two ways:

- **Guest**: `SignupGuestUser` makes a guest account and sets the `auth-token` cookie, then the participant is registered on the Campaign's workflow and the zip saved. `src/lib/services/join.ts`.
- **Email**: makes an account for the email and signs this browser in. An email that already has an account gets a code instead. `src/lib/services/email-join.ts`.

Every Campaign shares one origin, so one cookie: someone who joined one Campaign arrives at another already signed in and is only registered on its workflow. Signed-in participants get an account menu and a profile page at `/profile`. Sign out clears the cookie and the local cache (`sign-out.ts`). The cookie is httpOnly, set by the backend through the proxy.

Admin has real login and signup pages (`/login`, `/signup`, `/welcome`).

## api-client

`@crownshy/api-client` = TypeScript client generated from the backend's `open-api-spec.json`. Lives at `comhairle/ui/packages/api-client`. Consumed from npm (`civicos`, `admin` and `shared` pin a version). Create it with `createApiClient` from `@civicos/shared/api`, never a hand-rolled `fetch`.

**Use a local copy when iterating on backend types**:

```sh
# in comhairle's api-client package
pnpm install && pnpm build && pnpm link --global

# back here, in each package that uses it
pnpm link --global @crownshy/api-client
```

Backend has `just api-watch` = cargo watch + spec rebuild. On change, Vite HMR picks up new types.

Undo: `pnpm unlink --global @crownshy/api-client && pnpm install`.

## Day-to-day

From the repo root:

| cmd                                               | does                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm dev:admin` / `pnpm dev:report` | dev servers :5173 / :5174 / :5175                                                        |
| `pnpm build`                                      | build every package                                                                      |
| `pnpm check`                                      | svelte-check across packages (civicos and admin have a floor of 3 errors, see AGENTS.md) |
| `pnpm lint`                                       | prettier + eslint, all four packages                                                     |
| `pnpm test`                                       | vitest across the apps                                                                   |
| `pnpm --filter civic-os storybook`                | storybook :6006 (admin: `--filter @civicos/admin`, :6007)                                |
| `pnpm --filter @civicos/report test:e2e`          | report's playwright suite                                                                |

Format only files you touched: `pnpm --filter <pkg> exec prettier --write <files>`. Not the repo-wide `pnpm format`.

## Deploy

One Docker image per app: `Dockerfile` (civicos), `Dockerfile.admin`, `Dockerfile.report`. `.github/workflows/docker-image.yml` builds them; `tests.yml` runs install + `pnpm test`. PRs go to `stage`.

## Troubleshooting

- `fetch failed` everywhere → backend down or `API_URL` wrong in that package's `.env`. `curl $API_URL/health`.
- Polis empty → the Campaign's `metadata.poll.polisId` doesn't map to a real conversation on `polis.comhairle.scot`.
- Your seeded Campaign isn't on `/` → check `API_URL` in `packages/civicos/.env` points at the backend you seeded (`http://localhost:3000`). The Campaign lives on the backend, not in `.env`.
- api-client types don't match the backend → bump the published package or use the `pnpm link` workflow above.

## Map

```
packages/
├── civicos/src/
│   ├── routes/
│   │   ├── api/[...path]/+server.ts   proxy → comhairle
│   │   ├── +page.svelte               directory of live Campaigns
│   │   ├── [campaign]/                Campaign landing + join sheet, or Place listing
│   │   │   └── (campaign)/            poll/ events/ report/
│   │   ├── profile/                   participant profile
│   │   ├── conversations/             308 to /
│   │   └── [org]/conversations/…      308 from the old URLs
│   └── lib/
│       ├── config/                    campaign.ts, place.ts, regions.ts facade, host copy
│       └── services/                  join, email-join, session, profile, polis-api, events
├── admin/src/routes/                  /, c/[slug], c/new, hosts/, login/, signup/, welcome/
├── report/src/routes/[slug]/          consensus/ cta/ demographics/ groups/ themes/
└── shared/src/
    ├── ui/                            shadcn-svelte primitives
    ├── data/                          regions.ts, zipcodes, metadata readers
    ├── styles/theme.css               design tokens
    └── api.ts                         createApiClient
```
