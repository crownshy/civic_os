import type { ReportRecord } from './domain/types';

/**
 * Which record is "selected" is a fact about the record, not about a page or a
 * position in a list: a statement's card can appear in an insight carousel and
 * in All Statements at once, and both should mark. Keyed by id so every
 * instance lights up without anyone querying the document for them.
 */
export const selection = $state<{ recordId: string | null }>({ recordId: null });

/**
 * The three modals. They are opened from pages that know nothing about each
 * other, so their state lives here rather than being threaded through props.
 */
export const modals = $state<{
	statement: { view: readonly ReportRecord[]; index: number } | null;
	group: string | null;
	demographics: boolean;
}>({
	statement: null,
	group: null,
	demographics: false
});

export function openStatement(view: readonly ReportRecord[], index: number) {
	// a card whose record is not in its own page's list arrives as -1; there is
	// nothing to show, so do not open
	if (index < 0 || index >= view.length) return;
	modals.statement = { view, index };
	selection.recordId = view[index].id;
}

export function pageStatement(delta: number) {
	const open = modals.statement;
	if (!open) return;
	const index = open.index + delta;
	if (index < 0 || index >= open.view.length) return;
	modals.statement = { view: open.view, index };
	selection.recordId = open.view[index].id;
}

export function closeStatement() {
	modals.statement = null;
	selection.recordId = null;
}
