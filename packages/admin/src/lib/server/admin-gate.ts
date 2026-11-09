import type { UserOrganizationsResponse } from '@crownshy/api-client/api';
import type { BackendClient } from './backend-client';
import { toHostAccess } from '$lib/host-access';

export type AdminGate = 'admin' | 'unauthorized' | 'forbidden';

type GateApi = Pick<BackendClient, 'ListRegions' | 'GetUserOrganizations'>;

const ADMIN_TTL_MS = 30_000;
const MAX_REMEMBERED = 1_000;

/**
 * Remembers which sessions passed the gate, for `ttlMs`. Every navigation and
 * hover preload goes through the gate, and each probe is up to two comhairle
 * calls, so without this a few clicks a second become a steady stream of them.
 * Only passes are remembered; a refusal is always checked again. Losing admin
 * access takes up to `ttlMs` to apply. Logging out applies at once, because it
 * removes the cookie.
 */
export function createAdminCache(ttlMs = ADMIN_TTL_MS, now: () => number = Date.now) {
	const expiry = new Map<string, number>();
	return {
		has(token: string) {
			const until = expiry.get(token);
			if (until === undefined) return false;
			if (until > now()) return true;
			expiry.delete(token);
			return false;
		},
		remember(token: string) {
			if (expiry.size >= MAX_REMEMBERED) expiry.clear();
			expiry.set(token, now() + ttlMs);
		}
	};
}

type ApiFailure = {
	response?: { status?: number };
	cause?: { issues?: unknown[] };
	issues?: unknown[];
};

function failedValidation(e: ApiFailure) {
	return Array.isArray(e.issues) || Array.isArray(e.cause?.issues);
}

/**
 * Who may use admin: a comhairle system admin, or anyone in at least one Host
 * (#442). Host admins and members hold organization roles, not the system one,
 * so `/regions` turns them away and their Host membership has to be read as well.
 *
 * Only the status decides `/regions`, never the body, so drift between the
 * generated client and that endpoint cannot lock every system admin out. A
 * request that never reached the server rethrows.
 */
export async function probeAdmin(api: GateApi): Promise<AdminGate> {
	try {
		await api.ListRegions({ queries: { limit: 1 } });
		return 'admin';
	} catch (e) {
		const err = e as ApiFailure;
		if (failedValidation(err)) return 'admin';
		const status = err.response?.status;
		if (status === undefined) throw e;
		if (status === 403) return 'forbidden';
	}

	// comhairle answers "not a system admin" with the same 401 as "not logged
	// in". GetUserOrganizations only needs a signed-in user, so its 401 is the
	// logged-out case.
	try {
		const orgs: UserOrganizationsResponse = await api.GetUserOrganizations();
		const access = toHostAccess(orgs);
		return access.all || access.hosts.length > 0 ? 'admin' : 'forbidden';
	} catch (e) {
		const err = e as ApiFailure;
		if (err.response?.status === 401) return 'unauthorized';
		if (err.response?.status === undefined && !failedValidation(err)) throw e;
		// Signed in, but membership is unreadable: refuse rather than guess.
		return 'forbidden';
	}
}
