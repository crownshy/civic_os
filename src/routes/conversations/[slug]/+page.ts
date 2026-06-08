import { redirect } from '@sveltejs/kit';
import type { PageLoad } from '../$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { region, api } = await parent();
	const { slug } = params;

	try {
		const event = await api.GetEvent({
			params: { conversation_id: region.conversationId, event_id: slug }
		});

		return { event };
	} catch (e) {
		console.error(e);

		redirect(302, '/conversations');
	}
};
