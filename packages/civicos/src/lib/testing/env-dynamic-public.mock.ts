// Swapped in for `$env/dynamic/public` in environments (like Storybook & Vitest), in which SvelteKit's magic env var
// support doesn't work. See for more context: https://github.com/sveltejs/kit/issues/10446
export const env: Record<string, string> = {};
