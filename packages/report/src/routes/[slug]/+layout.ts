import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

// Placeholder. Comhairle conversation slugs are globally unique, so once this
// report stops carrying its own bundled data this becomes a real lookup
// (GET /conversation/{id_or_slug} already accepts a slug) rather than a match
// against one hardcoded string.
const SLUG = 'central-oregon-ai';

export const load: LayoutLoad = ({ params }) => {
	if (params.slug !== SLUG) error(404, 'Report not found');
	return {};
};
