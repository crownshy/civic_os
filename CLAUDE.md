# CLAUDE.md

Claude Code reads this file automatically. The working agreement lives in
[AGENTS.md](AGENTS.md) (and the docs it points to: `STYLE_GUIDE.md`, `CONTEXT.md`,
`docs/component-strategy.md`, `docs/adr`). It is imported below so it is always in
context; read it before writing code.

@AGENTS.md

## Svelte MCP server

Use the Svelte MCP server whenever Svelte or SvelteKit work is involved. It provides
official Svelte 5 / SvelteKit docs, examples, and a code checker.

- **`list-sections`** call this FIRST when a task touches Svelte or SvelteKit, to
  discover the available documentation sections.
- **`get-documentation`** after `list-sections`, fetch the full content of every section
  whose `use_cases` are relevant to the task.
- **`svelte-autofixer`** run any Svelte component you write through this before finishing,
  and keep calling it until it returns no issues or suggestions.
- **`playground-link`** only offer this after code is complete and the user confirms, and
  never when the code has already been written to files in the project.

<!--
Claude-only notes can go below the import. If agents skip the frontend conventions, add
`@STYLE_GUIDE.md` here to force the full working agreement into context.
-->
