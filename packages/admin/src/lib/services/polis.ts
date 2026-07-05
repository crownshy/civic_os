import { env } from '$env/dynamic/public';

/**
 * Direct Polis API access for the admin app.
 *
 * This mirrors what the public `civicos` app does in
 * `lib/services/polis-api.svelte.ts` — it POSTs comments straight to Polis at
 * `/api/v3/comments`. The only difference for host seeding is `is_seed: true`.
 *
 * ⚠️ AUTH CAVEAT (testing): civicos submits as an anonymous *participant*
 * (`xid`, `is_seed: false`). A *seed* is an owner-level action, so Polis may
 * require the conversation **owner's** auth, and this is a **cross-origin**
 * request (admin origin → Polis) that depends on Polis CORS allowing the admin
 * domain with credentials. If this 401/403/CORS-fails, the correct home is a
 * comhairle server endpoint that holds the owner token and posts server-side —
 * see the note on `createStatementAux` in `$lib/api/aux.ts`.
 */
export const POLIS_URL = env.PUBLIC_POLIS_URL || 'https://polis.comhairle.scot';

/**
 * Author a moderator seed statement directly in Polis. Resolves once Polis
 * accepts it; the caller should then `syncStatementAux` to pull the new comment
 * (with its real Polis-issued ids) into the aux table.
 */
export async function submitSeed(polisId: string, txt: string): Promise<void> {
	const res = await fetch(`${POLIS_URL}/api/v3/comments`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			agid: 1,
			conversation_id: polisId,
			txt,
			vote: -1,
			is_seed: true
		})
	});
	if (!res.ok) {
		throw new Error(`Polis rejected the seed (${res.status})`);
	}
}
