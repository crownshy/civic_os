import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		output: {
			// Put the per-chunk preload hints in the HTML head. The default 'modulepreload'
			// strategy only sends them in the `link` response header, which hooks.server.ts
			// strips so a route with many chunks cannot overflow nginx's header buffer (502).
			preloadStrategy: 'preload-mjs'
		},
		csrf: {
			// Disable origin checking because /api/* routes are proxy endpoints
			// The actual API backend handles its own CSRF/security
			checkOrigin: false
		}
	}
};

export default config;
