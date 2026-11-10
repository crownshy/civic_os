import type { ApiClient } from '@crownshy/api-client/api';
import { invalidate } from '$app/navigation';
import { session } from './session.svelte';

/**
 * Sign this browser out: comhairle clears the cookies, the cache forgets the
 * participant, and the root layout re-resolves to nobody.
 *
 * The cache is cleared even when the call fails, so "Not you?" never leaves a
 * stranger's progress behind on a shared device.
 */
export async function signOut(api: Pick<ApiClient, 'LogoutUser'>): Promise<void> {
	try {
		await api.LogoutUser(undefined);
	} catch (e) {
		console.error('[Session] Failed to sign out:', e);
	}
	session.signOut();
	await invalidate('civicos:participant');
}
