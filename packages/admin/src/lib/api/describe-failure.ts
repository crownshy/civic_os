/**
 * The HTTP status a failed api-client call came back with, when it got that far.
 *
 * Undefined for the failures that never reached a status: a schema mismatch, a
 * network error. Callers that special-case one status (409 on a taken slug) need
 * to tell those apart from "some other status", which a truthiness check does
 * not.
 */
export function apiStatus(error: unknown): number | undefined {
	const status = (error as { response?: { status?: number } })?.response?.status;
	return typeof status === 'number' ? status : undefined;
}

/**
 * Turn a failed api-client call into one sentence safe to show in the UI.
 *
 * A failure here is almost always one of two things, and they need opposite
 * fixes: the backend refused or broke (an HTTP status), or the backend answered
 * fine and the generated zod schema rejected the payload (an API client built
 * against a different backend version). Rendering "could not load" for both
 * sends people hunting for permission problems that do not exist.
 *
 * Only the status code and the shape of the error are exposed. Response bodies
 * and messages from the backend are not, since they can carry request detail.
 */
export function describeApiFailure(error: unknown): string {
	const err = error as {
		cause?: { issues?: unknown[] };
		issues?: unknown[];
		code?: string;
	};

	const status = apiStatus(error);
	if (typeof status === 'number') {
		if (status === 401 || status === 403) {
			return `the server rejected the request (${status}). Your session may have expired, or this account lacks access.`;
		}
		return `the server responded ${status}.`;
	}

	// Zodios wraps schema mismatches; a ZodError carries an `issues` array.
	if (Array.isArray(err?.issues) || Array.isArray(err?.cause?.issues)) {
		return 'the response did not match the shape this app expects. The admin build and the backend are probably on different versions.';
	}

	if (err?.code) return `the request failed (${err.code}).`;

	return 'the request failed before the server answered.';
}

/**
 * The sentence to show when comhairle refused a call with 403, or null for any
 * other failure. Comhairle checks roles per Campaign, so a Host admin who neither
 * owns the Campaign nor holds a role on it is refused too; saying so beats a
 * generic "could not" that reads like an outage.
 */
export function permissionDenied(error: unknown, action: string): string | null {
	if (apiStatus(error) !== 403) return null;
	return `You do not have permission to ${action}. Ask the Campaign owner to give you a role on this Campaign.`;
}

/**
 * The sentence to show when a Polis call (sync, seeding) failed for a reason the Host can
 * act on, or null to keep the caller's generic line. A 403 and a 422 otherwise read the
 * same, and they need different people to fix them (#497).
 *
 * The 422 carries Comhairle's `err` text, unlike `describeApiFailure`: it names the
 * misconfigured step ("Workflow Step has wrong type expected Polis"), and this is an
 * admin-only surface.
 */
export function polisFailure(error: unknown, action: string): string | null {
	const denied = permissionDenied(error, action);
	if (denied) return denied;
	if (apiStatus(error) !== 422) return null;

	const detail = (error as { response?: { data?: { err?: unknown } } })?.response?.data?.err;
	const suffix = typeof detail === 'string' && detail ? ` Comhairle said: "${detail}".` : '';
	return `This conversation's Polis step is not set up correctly.${suffix}`;
}
