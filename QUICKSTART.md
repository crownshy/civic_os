# Quickstart

This points the app at the staging backend (https://bloom.comhairle.scot) and the real Polis ids for those regions — no local backend needed.

```sh
# 1. Node 22.12 + pnpm 9.15 (skip if you have them)
nvm install 22.12 && nvm use 22.12
corepack enable && corepack prepare pnpm@9.15.0 --activate

# 2. Install (from repo root — installs the whole pnpm workspace)
pnpm install

# 3. Config: env lives in the civicos package
cp packages/civicos/.env.example packages/civicos/.env
# then edit packages/civicos/.env to use staging:
#   API_URL=https://bloom.comhairle.scot
#   API_PREFIX=/api

# 4. Run (root script; civicos on :5173)
pnpm dev
```

Open <http://localhost:5173>. Region subdomains: <http://utah.localhost:5173>, <http://oregon.localhost:5173>.

Admin dashboard (optional): `pnpm dev:admin` → <http://localhost:5174>.

Stop: `Ctrl+C`. Start again: `pnpm dev`. That's it.

---

## Full local stack (optional)

Want own Postgres + API + seeded conversation? Need [comhairle](https://github.com/...) repo cloned next to this one, plus Nix (flakes) + Docker.

```sh
# In comhairle repo — 3 shells
nix develop
cp .env.example .env
just pg         # shell A: postgres :5434
just api-dev    # shell B: api :3000
just seed       # shell C: makes admin@crown-shy.com / adminPassword123!
```

Back in this repo (leave `API_URL=http://localhost:3000` in `packages/civicos/.env`):

```sh
packages/civicos/scripts/seed-dev.sh   # mints conversation/invite/polis ids, writes to packages/civicos/.env
pnpm dev
```

Open <http://dev.localhost:5173>. The `dev` region only shows up when all 4 `PUBLIC_DEV_*` ids are in `packages/civicos/.env`. Re-seed = re-run script + restart `pnpm dev`.

Want to test prod redirect logic? Comment out the `PUBLIC_DEV_*` lines, restart.

For deeper stuff (monorepo layout, regions, auth, api-client, polis redirect) → [README.md](README.md).
