# Quickstart

Fastest path: run the apps here against the staging backend. No Rust, no Postgres.

```sh
# 1. Node (version from .nvmrc) + pnpm 12.3.4 (skip if you have them)
nvm install && nvm use
corepack enable && corepack prepare pnpm@12.3.4 --activate

# 2. Install
pnpm install

# 3. Config, one .env per app
cp packages/civicos/.env.example packages/civicos/.env
cp packages/admin/.env.example packages/admin/.env   # only if you run admin
```

Then in each `.env`, swap the local backend for staging:

```env
API_URL=https://bloom.comhairle.scot
API_PREFIX=/api
```

```sh
# 4. Run (from the repo root)
pnpm dev          # participant app → http://localhost:5173
pnpm dev:admin    # admin           → http://localhost:5174
pnpm dev:report   # public report   → http://localhost:5175 (no backend needed)
```

<http://localhost:5173> is the directory of live Campaigns. A Campaign is at `/<conversation-slug>`, a Place's Campaigns at `/<place-slug>` (e.g. <http://localhost:5173/utah>). Admin needs an account on staging.

Stop: `Ctrl+C`.

Staging is shared. Anything you create or vote on there is real data for everyone else on it, so use the full local stack for anything messy.

---

## Full local stack (optional)

Own Postgres + API + a seeded Campaign. Needs the [comhairle](https://github.com/crownshy/comhairle) repo cloned, plus Nix (flakes) + Docker.

```sh
# In the comhairle repo, 3 shells
nix develop
cp .env.example .env
just pg         # shell A: postgres :5434
just api-dev    # shell B: api :3000
just seed       # shell C: makes admin@crown-shy.com / adminPassword123!
```

Back in this repo, with `API_URL=http://localhost:3000` in both `.env` files (the `.env.example` default):

```sh
./scripts/seed-dev.sh   # logs in as that admin, creates a Campaign in Dundee
pnpm dev
```

The script prints where to go: the Campaign at `http://localhost:5173/<slug>`, the directory at `/`, and the Place page at `/dundee`. Log into admin at <http://localhost:5174> as `admin@crown-shy.com` to see and edit it.

Nothing about the Campaign goes in `.env`; it lives on the backend. The script only tidies older `.env` files (removes the retired `PUBLIC_DEV_*` vars, adds `PUBLIC_PARTICIPANT_BASE_URL` to admin's). Run it again any time you want another Campaign. Pin the names with `SEED_SLUG=my-slug` or `SEED_PLACE_SLUG=my-place`.

If it fails creating the conversation, the login user isn't an admin on the backend: run `just seed` in comhairle, or add the email to `ADMIN_USERS` in comhairle's `.env` and restart `just api-dev`.

For deeper stuff (packages, Campaigns, auth, api-client, zip redirect) → [README.md](README.md).
