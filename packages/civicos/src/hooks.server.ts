import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

/**
 * SvelteKit mirrors every modulepreload into a `Link` response header, which on
 * a page with many chunks overflows nginx's default `proxy_buffer_size` and
 * turns a full-page refresh into a 502. The preloads are already `<link>` tags
 * in the HTML head, so the header is redundant.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});
	if (response.headers.has('link')) response.headers.delete('link');
	return response;
};
