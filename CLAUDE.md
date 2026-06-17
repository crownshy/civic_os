# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The README is the source of truth for architecture, setup, commands, regions, auth, and deploy — it's imported below. Read it, then follow the agent-specific rules that come after.

@README.md

## Agent-specific guidance

These are rules for working in this repo that the README doesn't cover (it's written for humans, not the agent).

### Svelte

- This codebase is **Svelte 5 with runes** (`$state`, `$effect`, `$props`, `$derived`). Never write legacy Svelte 4 syntax (`export let`, `$:`, stores-as-default, `on:` directives where the new event-attribute form applies).
- The **Svelte MCP server is mandatory** for any Svelte work:
  1. `list-sections` first — scan the `use_cases` fields.
  2. `get-documentation` for every section relevant to the task.
  3. `svelte-autofixer` on any Svelte code you write — keep calling until it returns no issues/suggestions, before showing the user.
  4. `playground-link` only after the user confirms, and **never** when the code was written to files in their project.

### Working in this repo

- **Never call the backend directly from browser code.** Always go through the `/api/[...path]` proxy — bypassing it breaks Safari iOS cookies (the README explains why). Same rule in the admin app.
- **`regions.ts` ids are live production deploys.** For local work use the `dev` or `testing` region; only touch utah/oregon ids if you intend to change prod.
- Leave the `fixApiClientPlugin` shim in `vite.config.ts` — it patches the api-client's ESM resolution.
- Don't put sensitive data in the `civic-os-session` localStorage blob; the auth token belongs only in the httpOnly cookie.
