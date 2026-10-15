/**
 * What an emailed comhairle link token says about itself: the address it was
 * sent to and when it stops working.
 *
 * The signature is not checked here, and cannot be, since only comhairle holds
 * the secret. Use this for display and for choosing which email to log in with,
 * never as proof of anything. comhairle verifies the token on every call that
 * consumes it.
 */
export type EmailLinkToken = { email: string | null; expiresAt: Date | null };

export function readEmailLinkToken(token: string): EmailLinkToken | null {
	const payload = token.split('.')[1];
	if (!payload) return null;

	try {
		const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
			email?: unknown;
			exp?: unknown;
		};
		return {
			email: typeof claims.email === 'string' ? claims.email : null,
			expiresAt: typeof claims.exp === 'number' ? new Date(claims.exp * 1000) : null
		};
	} catch {
		return null;
	}
}

export function isExpired(token: EmailLinkToken, now = new Date()): boolean {
	return token.expiresAt !== null && token.expiresAt <= now;
}
