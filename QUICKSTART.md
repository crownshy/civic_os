# Quickstart

This will use the staging backend at https://bloom.comhairle.scot and the actual Polis ids for those regions (confim).

```sh
# 1. Node (version from .nvmrc) + pnpm 12.3.4 (skip if you have them)
nvm install && nvm use
corepack enable && corepack prepare pnpm@12.3.4 --activate

# 2. Install + config
pnpm install
cp .env.example .env   # defaults point at testing conversation — safe

# 3. Run
pnpm dev
```

Open <http://localhost:5173>. It redirects to the directory of live conversations. A Place's conversations are at `/<place-slug>`, e.g. <http://localhost:5173/utah>.

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

Back in this repo:

```sh
./scripts/seed-dev.sh   # mints conversation/invite/polis ids, writes to .env
pnpm dev
```

Open the URL the script prints (`http://localhost:5173/host/conversations/<slug>`). Re-seed = re-run script + restart `pnpm dev`.

For deeper stuff (regions, auth, api-client, polis redirect) → [README.md](README.md).
