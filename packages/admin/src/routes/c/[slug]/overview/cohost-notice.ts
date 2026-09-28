import type { ActionResult } from '@sveltejs/kit';

/**
 * What a co-host action has to tell the Host: the error when it failed, the
 * warning when it saved but the public page did not follow, otherwise nothing.
 */
export function noticeFrom(result: ActionResult): string | null {
	if (result.type !== 'failure' && result.type !== 'success') return null;
	const data = result.data as { error?: unknown; warning?: unknown } | undefined;
	const text = result.type === 'failure' ? data?.error : data?.warning;
	return typeof text === 'string' ? text : null;
}
