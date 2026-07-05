/**
 * Re-exports for the polis_statement_aux types now that
 * @crownshy/api-client@0.0.9 ships them. Kept as a tiny shim so existing
 * `$lib/types/aux` imports keep working — delete this file and import from
 * `@crownshy/api-client` directly if/when it feels worth the churn.
 */

export type {
	PolisStatementAux,
	CreatePolisStatementAux,
	UpdatePolisStatementAux,
	ModerationStatus,
	ModerateStatementAuxRequest,
	ModerationDecisionRequest,
	SyncStatementAuxResponse
} from '@crownshy/api-client/api';
