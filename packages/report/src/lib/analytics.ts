import { trackEvent } from '@lukulent/svelte-umami';
import type { ReportRecord } from './domain/types';

/**
 * Event names match the upstream report's, so its Umami dashboards carry
 * over. Paging to another statement counts as opening it, as it does there.
 */
export function trackStatementOpen(record: ReportRecord | undefined) {
	if (record) trackEvent('statement-open', { id: record.id, kind: record.kind });
}
