import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		output: {
			// Put the per-chunk preload hints in the HTML head. The default 'modulepreload'
			// strategy only sends them in the `link` response header, which hooks.server.ts
			// strips: on the /c/[slug] pages it outgrew nginx's header buffer and a full-page
			// load answered 502.
			preloadStrategy: 'preload-mjs'
		}
	}
};

export default config;
