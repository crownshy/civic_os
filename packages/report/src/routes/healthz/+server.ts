import type { RequestHandler } from './$types';

/**
 * Readiness and liveness probe target for the deployed container. It has to
 * keep answering 2xx: anything else leaves the pod unready behind a 503.
 */
export const GET: RequestHandler = () =>
	new Response('ok', { headers: { 'cache-control': 'no-store' } });
