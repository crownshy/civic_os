/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { playwright } from '@vitest/browser-playwright';

// Mirror the api-client ESM resolution fix from civicos.
// dist/client.js imports './api' without .js extension.
function fixApiClientPlugin() {
	return {
		name: 'fix-api-client-esm',
		enforce: 'pre' as const,
		resolveId(source: string, importer: string | undefined) {
			if (
				source === './api' &&
				importer &&
				importer.includes('@crownshy/api-client') &&
				importer.endsWith('client.js')
			) {
				return importer.replace('client.js', 'api.js');
			}
		}
	};
}

export default defineConfig({
	plugins: [fixApiClientPlugin(), tailwindcss(), sveltekit()],
	server: {
		port: 5173,
		allowedHosts: ['.localhost'],
		fs: {
			// Allow serving from sibling workspace packages (e.g. @civicos/shared).
			allow: ['..']
		}
	},
	test: {
		expect: {
			// Every test must make at least one assertion (mirrors civicos).
			requireAssertions: true
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			}
		]
	}
});
