import type {
	PolisStatementAux,
	UpdatePolisStatementAux,
	ModerateStatementAuxRequest
} from '$lib/types/aux';

/**
 * Wrappers around comhairle's /tools/polis/statement_aux endpoints.
 *
 * Both reads and mutations go through SvelteKit's `fetch` against the admin's
 * `/api` proxy. In `load` functions, pass the `fetch` argument so cookies are
 * forwarded during SSR; on the client, the global `fetch` works fine.
 *
 * Types come from `@crownshy/api-client/api` (added in 0.0.9).
 */

export async function listStatementAux(
	fetchFn: typeof fetch,
	workflow_step_id: string
): Promise<PolisStatementAux[]> {
	const res = await fetchFn(
		`/api/tools/polis/statement_aux?workflow_step_id=${encodeURIComponent(workflow_step_id)}`
	);
	if (!res.ok) throw new Error(`listStatementAux → ${res.status}`);
	return (await res.json()) as PolisStatementAux[];
}

/** Client-side: PUT /api/tools/polis/statement_aux/:id. */
export async function updateStatementAux(
	id: string,
	patch: UpdatePolisStatementAux
): Promise<PolisStatementAux> {
	const res = await fetch(`/api/tools/polis/statement_aux/${id}`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(patch)
	});
	if (!res.ok) {
		throw new Error(`updateStatementAux ${id} → ${res.status}`);
	}
	return (await res.json()) as PolisStatementAux;
}

/**
 * Client-side: POST /api/tools/polis/statement_aux/:id/moderate.
 *
 * Unlike `updateStatementAux`, this forwards the accept/reject decision to the
 * Polis server using the admin account, then updates the aux row. Use this for
 * accept/reject; use `updateStatementAux` for local-only edits (themes,
 * statement_text, etc.).
 */
export async function moderateStatementAux(
	id: string,
	body: ModerateStatementAuxRequest
): Promise<PolisStatementAux> {
	const res = await fetch(`/api/tools/polis/statement_aux/${id}/moderate`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		throw new Error(`moderateStatementAux ${id} → ${res.status}`);
	}
	return (await res.json()) as PolisStatementAux;
}
