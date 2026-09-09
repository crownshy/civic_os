import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		expect: {
			requireAssertions: true
		},
		environment: 'node',
		include: ['src/**/*.spec.ts']
	}
});
