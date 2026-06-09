import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			// Disable origin checking because /api/* routes are proxy endpoints
			// The actual API backend handles its own CSRF/security
			checkOrigin: false
		}
	}
};

export default config;
