import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
	const eventDateFormatter = new Intl.DateTimeFormat('en', {
		month: 'long',
		day: 'numeric'
	});

	const eventTimeFormatter = new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});

	return { eventDateFormatter, eventTimeFormatter };
};
