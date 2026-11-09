import { describe, expect, it } from 'vitest';
import { createApiClient } from '@civicos/shared/api';

describe('createApiClient', () => {
	it('never follows a redirect on the server', () => {
		const api = createApiClient('http://backend', 'token', 'server');
		expect(api.axios.defaults.maxRedirects).toBe(0);
	});

	it('leaves the browser client alone', () => {
		const api = createApiClient('/api', undefined, 'client');
		expect(api.axios.defaults.maxRedirects).toBeUndefined();
	});
});
