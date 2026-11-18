import { serverApi } from '@civicos/shared/api';
import { HOST_SESSION_COOKIE } from '@civicos/shared/data/host-session';
import { loadCampaignQuestions, loadPreviewQuestions } from '$lib/services/demographics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url, parent, depends }) => {
	depends('civicos:demographics');
	const { campaign, preview, previewOrganizationId, participant, participantResolved } =
		await parent();

	if (!preview && !participant) {
		return {
			aboutYouQuestions: [],
			demographicsError: participantResolved ? null : 'We could not load your questions.'
		};
	}

	try {
		if (preview) {
			const token = cookies.get(HOST_SESSION_COOKIE);
			if (!token) throw new Error('The Host session is unavailable.');
			return {
				aboutYouQuestions: await loadPreviewQuestions(
					serverApi(url, token),
					campaign.id,
					previewOrganizationId
				),
				demographicsError: null
			};
		}
		const token = cookies.get('auth-token');
		if (!token) throw new Error('The participant session is unavailable.');
		return {
			aboutYouQuestions: await loadCampaignQuestions(serverApi(url, token), campaign.id),
			demographicsError: null
		};
	} catch (error) {
		console.error('[About You] Could not load the Campaign questions:', error);
		return {
			aboutYouQuestions: [],
			demographicsError: preview
				? 'We could not load this preview. A pinned question or form version may be unavailable.'
				: 'We could not load your questions. Check your connection and try again.'
		};
	}
};
