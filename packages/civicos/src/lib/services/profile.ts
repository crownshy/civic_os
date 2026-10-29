import type { ApiClient } from '@crownshy/api-client/api';
import { httpStatusOf } from '$lib/utils/http';
import { session } from './session.svelte';

/** What a profile write needs to know about where it is being made. */
export interface ProfileContext {
	api: Pick<
		ApiClient,
		'UpsertUserProfile' | 'CreateDemographicsResponse' | 'UpdateDemographicsResponse'
	>;
	/**
	 * A Host previewing a draft. An answer filed now would count in the live
	 * Campaign's numbers, under the Host's own account, so nothing is sent.
	 */
	preview: boolean;
}

/** The About You answers comhairle keeps on the profile itself. */
export interface ProfileAnswers {
	zipcode?: string;
	age?: number;
	ethnicity?: string;
	gender?: string;
	consented?: boolean;
	politicalParty?: string;
}

export async function saveProfile(
	context: ProfileContext,
	answers: ProfileAnswers
): Promise<boolean> {
	if (context.preview) return true;

	// Only the fields this call has a value for. `UpsertUserProfileRequest` is
	// fully optional and the upsert merges, so an omitted field keeps what is
	// stored. Sending an explicit null does not clear it either, and comhairle
	// resolves a demographics question for every key in the body, so a null
	// for an unanswered category 404s the whole request with
	// `demographics_question not found` and joining fails on the zip.
	//
	// The zip rides on every call regardless: the About You screen sends
	// demographics and no zip, and the server side gate on `/poll`
	// reads the stored zip back.
	const zipcode = answers.zipcode || session.zipCode;
	const body = {
		consented: answers.consented ?? true,
		...(zipcode ? { zipcode } : {}),
		...(answers.age !== undefined ? { age: answers.age } : {}),
		...(answers.ethnicity ? { ethnicity: answers.ethnicity } : {}),
		...(answers.gender ? { gender: answers.gender } : {}),
		...(answers.politicalParty ? { politicalParty: answers.politicalParty } : {})
	};
	try {
		await context.api.UpsertUserProfile(body);
		return true;
	} catch (e) {
		console.error('[Profile] Failed to save profile:', e);
		return false;
	}
}

/**
 * File an answer to a Host's own About You category (#441). The four
 * built-ins go through `saveProfile`; comhairle has no profile column for
 * anything else. An answer already on file, from a retry or a second pass,
 * is a 409 on create, so that one is updated instead.
 */
export async function saveDemographicResponse(
	context: ProfileContext,
	questionSlug: string,
	value: string
): Promise<boolean> {
	if (context.preview) return true;

	const userId = session.userId;
	if (!userId) return false;

	try {
		await context.api.CreateDemographicsResponse({ questionSlug, userId, value });
		return true;
	} catch (e) {
		if (httpStatusOf(e) !== 409) {
			console.error(`[Profile] Failed to save "${questionSlug}":`, e);
			return false;
		}
	}

	try {
		await context.api.UpdateDemographicsResponse(
			{ value },
			{ params: { question_slug: questionSlug, user_id: userId } }
		);
		return true;
	} catch (e) {
		console.error(`[Profile] Failed to update "${questionSlug}":`, e);
		return false;
	}
}
