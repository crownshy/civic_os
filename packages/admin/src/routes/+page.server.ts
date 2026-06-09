import { redirect } from '@sveltejs/kit';
import { REGIONS } from '@civicos/shared/data/regions';

export function load() {
	// Default landing → first available conversation's events list.
	const first = Object.values(REGIONS).find((r) => r.events.length > 0) ?? Object.values(REGIONS)[0];
	if (first) throw redirect(307, `/c/${first.slug}/events`);
}
