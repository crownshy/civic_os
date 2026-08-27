import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiClient } from '@crownshy/api-client/client';
import { forwardAuthCookie, setCookiesOf } from './auth-cookie';

/**
 * Login is the one call that needs the response headers rather than the body,
 * so it reads `Set-Cookie` off the client's axios instance instead of the
 * parsed result (#381). These cover that seam: comhairle stands in as a local
 * server, including the case where it answers 200 with a body the generated
 * schema rejects, which must still sign the user in.
 */

const SESSION = 'auth-token=tok-abc123; Max-Age=604800; Path=/; HttpOnly; SameSite=None; Secure';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
	server = createServer(async (req, res) => {
		if (req.url === '/auth/login') {
			const body = await new Promise<string>((resolve) => {
				let raw = '';
				req.on('data', (c) => (raw += c));
				req.on('end', () => resolve(raw));
			});

			// 200 with the session set, but a body the generated UserDto rejects.
			if (body.includes('drift@b.c')) {
				res.writeHead(200, {
					'content-type': 'application/json',
					'set-cookie': [SESSION]
				});
				res.end('{"unexpected":true}');
				return;
			}

			res.writeHead(200, {
				'content-type': 'application/json',
				'set-cookie': [SESSION, 'unrelated=ignored; Path=/']
			});
			res.end(
				JSON.stringify({
					id: '0f9b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
					authType: 'email_password',
					emailVerified: true
				})
			);
			return;
		}
		res.writeHead(401, { 'content-type': 'application/json' });
		res.end('{"err":"invalid credentials"}');
	});

	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (address === null || typeof address === 'string') throw new Error('no port');
	baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

/** The capture the login action performs, run against the stand-in server. */
async function login(body: { email: string; password: string }) {
	const api = createApiClient(baseUrl, undefined, 'server');
	let setCookies: string[] = [];
	api.axios.interceptors.response.use((res) => {
		setCookies = setCookiesOf(res.headers);
		return res;
	});

	let threw = false;
	await api.LoginUser(body).catch(() => {
		threw = true;
	});
	return { setCookies, threw };
}

describe('login session capture', () => {
	it('captures the auth-token the backend sets, and ignores other cookies', async () => {
		const { setCookies, threw } = await login({ email: 'a@b.c', password: 'pw' });

		expect(threw).toBe(false);
		expect(setCookies).toEqual([SESSION, 'unrelated=ignored; Path=/']);
	});

	it('still captures the session when the reply fails schema validation', async () => {
		const api = createApiClient(baseUrl, undefined, 'server');
		let setCookies: string[] = [];
		api.axios.interceptors.response.use((res) => {
			setCookies = setCookiesOf(res.headers);
			return res;
		});

		let threw = false;
		await api.LoginUser({ email: 'drift@b.c', password: 'pw' }).catch(() => {
			threw = true;
		});

		expect(threw).toBe(true);
		expect(setCookies).toEqual([SESSION]);
	});

	it('captures nothing when the backend rejects the credentials', async () => {
		const api = createApiClient(`${baseUrl}/nope`, undefined, 'server');
		let setCookies: string[] = [];
		api.axios.interceptors.response.use((res) => {
			setCookies = setCookiesOf(res.headers);
			return res;
		});

		await api.LoginUser({ email: 'a@b.c', password: 'wrong' }).catch(() => {});

		expect(setCookies).toEqual([]);
	});
});

describe('forwardAuthCookie', () => {
	it('re-issues auth-token same-origin, keeping max-age and the flags', () => {
		const set: unknown[][] = [];
		const cookies = { set: (...args: unknown[]) => set.push(args) };

		const forwarded = forwardAuthCookie(SESSION, cookies as never);

		expect(forwarded).toBe(true);
		expect(set).toEqual([
			[
				'auth-token',
				'tok-abc123',
				{ path: '/', maxAge: 604800, secure: true, httpOnly: true, sameSite: 'lax' }
			]
		]);
	});

	it('leaves cookies other than auth-token alone', () => {
		const set: unknown[][] = [];
		const cookies = { set: (...args: unknown[]) => set.push(args) };

		const forwarded = forwardAuthCookie('unrelated=ignored; Path=/', cookies as never);

		expect(forwarded).toBe(false);
		expect(set).toEqual([]);
	});
});

describe('setCookiesOf', () => {
	it('normalises a single header, an array, and nothing at all', () => {
		expect(setCookiesOf({ 'set-cookie': [SESSION] })).toEqual([SESSION]);
		expect(setCookiesOf({ 'set-cookie': SESSION })).toEqual([SESSION]);
		expect(setCookiesOf({})).toEqual([]);
	});
});
