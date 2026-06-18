import { REGIONS } from '$lib/config/regions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const conversations = Object.values(REGIONS).map((r) => {
		const status: 'live' | 'idle' | 'draft' =
			r.slug === 'testing' || r.slug === 'dev'
				? 'idle'
				: r.conversationsActive === false
					? 'draft'
					: 'live';
		return {
			slug: r.slug,
			title: r.heroHeader,
			stateName: r.stateName,
			shareUrl: r.shareUrl,
			status,
			eventCount: r.events.length
		};
	});

	return { conversations };
};
