import { z } from 'zod';
import { placeFromName } from '@civicos/shared/data/place';
import { requiredText } from '$lib/validation/text-fields';

/** Create and edit form for a Place: a name and the areas it covers. */
export const placeSchema = z.object({
	name: requiredText('placeName', 'Name is required').refine(
		(s) => placeFromName(s) !== null,
		'The name needs at least one letter or number.'
	),
	areas: z
		.array(
			z.object({
				geoid: z.string().regex(/^\d+$/),
				level: z.enum(['state', 'county', 'city']),
				name: z.string().trim().min(1)
			})
		)
		.min(1, 'Pick at least one area.')
		.default([])
});

export type PlaceSchema = typeof placeSchema;

/** superforms message carried back from a Place action. */
export type PlaceMessage = { kind: 'error'; text: string };
