import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { extractSubdomain, getRegionBySubdomain } from '$lib/config/regions';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleRegion: Handle = ({ event, resolve }) => {
	const hostname = event.url.hostname;
	const subdomain = extractSubdomain(hostname);
	event.locals.region = getRegionBySubdomain(subdomain);
	return resolve(event);
};

export const handle: Handle = sequence(handleRegion, handleParaglide);
