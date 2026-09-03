/**
 * Reading an axios rejection as zodios surfaces it. The client rejects with an
 * `Error` carrying a `response`, and TypeScript types a `catch` binding as
 * `unknown`, so every caller that wants the status or the server's message ends
 * up casting. These are that cast, written once.
 */

/** The HTTP status, when the rejection carries one. */
export function httpStatusOf(e: unknown): number | undefined {
	const status = (e as { response?: { status?: unknown } })?.response?.status;
	return typeof status === 'number' ? status : undefined;
}

/** The message comhairle sent, when it sent one. */
export function httpErrorMessage(e: unknown): string | undefined {
	const message = (e as { response?: { data?: { err?: unknown } } })?.response?.data?.err;
	return typeof message === 'string' && message ? message : undefined;
}
