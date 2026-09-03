import { defineConfig } from '@playwright/test';

export default defineConfig({
	// A cold `vite build` plus preview can exceed Playwright's 60s default under load.
	webServer: { command: 'npm run build && npm run preview', port: 4174, timeout: 120_000 },
	testDir: 'e2e'
});
