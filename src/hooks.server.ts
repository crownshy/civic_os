import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';

// Disable CSRF for API proxy routes
const handleCsrf: Handle = async ({ event, resolve }) => {
	// Disable CSRF protection for /api/* routes (proxy endpoints)
	if (event.url.pathname.startsWith('/api/')) {
		return resolve(event, {
			filterSerializedResponseHeaders: (name) => name === 'content-type'
		});
	}
	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle: Handle = sequence(handleCsrf, handleParaglide);
