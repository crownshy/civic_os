import type { createApiClient } from '@crownshy/api-client/client';
import type {
	PolisStatementAux,
	CreatePolisStatementAux,
	UpdatePolisStatementAux,
	ModerateStatementAuxRequest,
	SyncStatementAuxResponse
} from '$lib/types/aux';

/**
 * Thin, typed wrappers around comhairle's /tools/polis/statement_aux endpoints.
 *
 * These delegate to the generated `@crownshy/api-client` (zodios) client, which
 * handles the `/api` base URL, cookie forwarding during SSR, and zod validation
 * of both request and response. Pass the `api` instance from the root layout
 * load (`data.api`, or `const { api } = await parent()` inside a load).
 */

type Api = ReturnType<typeof createApiClient>;

export function listStatementAux(api: Api, workflow_step_id: string): Promise<PolisStatementAux[]> {
	return api.PolisListStatementAux({ queries: { workflow_step_id } });
}

export function updateStatementAux(
	api: Api,
	id: string,
	patch: UpdatePolisStatementAux
): Promise<PolisStatementAux> {
	return api.PolisUpdateStatementAux(patch, { params: { id } });
}

/**
 * Forwards the accept/reject decision to the Polis server using the admin
 * account, then updates the aux row. Use this for accept/reject; use
 * `updateStatementAux` for local-only edits to `statement_text`, etc.
 */
export function moderateStatementAux(
	api: Api,
	id: string,
	body: ModerateStatementAuxRequest
): Promise<PolisStatementAux> {
	return api.PolisModerateStatementAux(body, { params: { id } });
}

/**
 * Insert an aux row for a statement that ALREADY exists in Polis.
 *
 * NOT an authoring endpoint: it does not create a comment in Polis, and the DB
 * has a unique key on `(workflow_step_id, polis_statement_id)`, so the caller
 * must supply the real Polis-issued id (sending `0` collides). Host seeding
 * therefore goes via Polis directly (`lib/services/polis.ts` → `is_seed: true`)
 * followed by `syncStatementAux`, which is why this wrapper is currently unused.
 *
 * TODO(comhairle): the clean home for seeding is a server endpoint that posts
 * the comment to Polis (holding the owner token, no browser CORS) and returns
 * the real id — then this wrapper records the aux row. Kept for that flow.
 */
export function createStatementAux(
	api: Api,
	body: CreatePolisStatementAux
): Promise<PolisStatementAux> {
	return api.PolisCreateStatementAux(body);
}

/** Idempotent — adding a theme that is already present is a no-op on the server. */
export function addStatementAuxTheme(
	api: Api,
	id: string,
	theme: string
): Promise<PolisStatementAux> {
	return api.PolisAddStatementAuxTheme({ theme }, { params: { id } });
}

/** Idempotent — removing a theme that is not present is a no-op on the server. */
export function removeStatementAuxTheme(
	api: Api,
	id: string,
	theme: string
): Promise<PolisStatementAux> {
	return api.PolisRemoveStatementAuxTheme({ theme }, { params: { id } });
}

/**
 * Pulls the latest comments + xid mappings from Polis and upserts an aux row
 * per statement. New participant submissions only appear in moderation after
 * this runs; existing rows keep their moderation_status, themes, etc.
 */
export function syncStatementAux(
	api: Api,
	workflow_step_id: string
): Promise<SyncStatementAuxResponse> {
	return api.PolisSyncStatementAux({ workflow_step_id });
}
