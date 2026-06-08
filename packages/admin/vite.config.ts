import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

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
		allowedHosts: ['.localhost']
	}
});
