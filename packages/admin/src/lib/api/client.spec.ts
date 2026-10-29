import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiClient as createGeneratedClient } from '@crownshy/api-client/client';
import { createApiClient } from '@civicos/shared/api';

// Comhairle stands in as a local server answering a write with 200 and an
// empty body. Zodios only validates JSON responses, so the header is what
// makes the generated client fail.
const ORG = '0f9b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d';
const USER = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
	server = createServer((_req, res) => {
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end();
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (address === null || typeof address === 'string') throw new Error('no port');
	baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const removeMember = (api: ReturnType<typeof createGeneratedClient>) =>
	api.RemoveOrganizationMember(undefined, { params: { organization_id: ORG, user_id: USER } });

describe('createApiClient', () => {
	it('resolves a write that answers with an empty body', async () => {
		await expect(removeMember(createApiClient(baseUrl, undefined, 'server'))).resolves.toBe(
			undefined
		);
	});

	it('is needed: the generated client rejects the same response', async () => {
		await expect(
			removeMember(createGeneratedClient(baseUrl, undefined, 'server'))
		).rejects.toThrow();
	});
});
