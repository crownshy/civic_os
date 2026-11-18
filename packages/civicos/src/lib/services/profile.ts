import type { ApiClient } from '@crownshy/api-client/api';

export interface ProfileContext {
	api: Pick<ApiClient, 'UpsertUserProfile'>;
	preview: boolean;
}

/**
 * The current profile endpoint only stores consent. It cannot save a Postcode,
 * so callers must not report a successful location change until the API offers
 * a participant-writable Postcode question.
 */
export async function saveProfile(
	context: ProfileContext,
	answers: { zipcode?: string; consented?: boolean }
): Promise<boolean> {
	if (context.preview) return true;
	if (answers.zipcode) {
		console.error('[Profile] The API cannot currently save a Postcode.');
		return false;
	}
	try {
		await context.api.UpsertUserProfile({ consented: answers.consented ?? true });
		return true;
	} catch (error) {
		console.error('[Profile] Failed to save profile:', error);
		return false;
	}
}
