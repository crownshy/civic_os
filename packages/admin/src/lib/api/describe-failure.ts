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
		response?: { status?: number };
		cause?: { issues?: unknown[] };
		issues?: unknown[];
		code?: string;
	};

	const status = err?.response?.status;
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
