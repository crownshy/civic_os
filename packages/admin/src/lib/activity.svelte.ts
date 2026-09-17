import { browser } from '$app/environment';
import { enhance as kitEnhance } from '$app/forms';
import { invalidate as kitInvalidate, invalidateAll as kitInvalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

/**
 * Work the user started that is still settling: a write to the backend, a form
 * action, or the reload that follows either. SvelteKit only reports navigations
 * (`navigating`), so a save and its `invalidate` would otherwise leave the page
 * looking idle. NavigationProgress reads `activity.busy`.
 *
 * Module state is shared across requests on the server, so only the browser
 * ever counts.
 */
let pending = $state(0);

export const activity = {
	get busy() {
		return pending > 0;
	}
};

/** Mark work as started. The returned `end` is safe to call more than once. */
export function begin(): () => void {
	if (!browser) return () => {};
	pending++;
	let ended = false;
	return () => {
		if (ended) return;
		ended = true;
		pending--;
	};
}

export async function track<T>(work: Promise<T>): Promise<T> {
	const end = begin();
	try {
		return await work;
	} finally {
		end();
	}
}

/**
 * `invalidate` that shows as busy. Use `$app/navigation`'s directly only for
 * background polling, which should not flash the progress bar.
 */
export const invalidate = (resource: Parameters<typeof kitInvalidate>[0]) =>
	track(kitInvalidate(resource));

export const invalidateAll = () => track(kitInvalidateAll());

/**
 * `enhance` from `$app/forms`, busy from submit until the result has been
 * applied (including the `update()` reload), or until `cancel()`.
 */
export function enhance(form: HTMLFormElement, submit: SubmitFunction = () => {}) {
	return kitEnhance(form, async (input) => {
		const end = begin();
		let callback: Awaited<ReturnType<SubmitFunction>>;
		try {
			callback = await submit({
				...input,
				cancel: () => {
					end();
					input.cancel();
				}
			});
		} catch (e) {
			end();
			throw e;
		}
		return async (opts) => {
			try {
				if (callback) await callback(opts);
				else await opts.update();
			} finally {
				end();
			}
		};
	});
}
