import type { ApiClient } from '@crownshy/api-client/api';
import { invalidate } from '$app/navigation';
import { httpStatusOf } from '$lib/utils/http';

/** What renaming came to. `taken` is another account already using that name. */
export type RenameResult = 'saved' | 'taken' | 'failed';

/**
 * Change the participant's name. Comhairle keeps it as the username, which is
 * unique, so two people called Jane Smith cannot both have it.
 */
export async function renameAccount(
	api: Pick<ApiClient, 'UpdateUserDetails'>,
	name: string
): Promise<RenameResult> {
	try {
		await api.UpdateUserDetails({ username: name });
	} catch (e) {
		if (httpStatusOf(e) === 409) return 'taken';
		console.error('[Account] Failed to rename:', e);
		return 'failed';
	}
	await invalidate('civicos:participant');
	return 'saved';
}

/**
 * The name to show for an account. An account made by email carries the
 * email as its username until someone names it, which is not a name.
 */
export function displayName(username: string | null, email: string | null): string {
	if (!username || username === email) return '';
	return username;
}
