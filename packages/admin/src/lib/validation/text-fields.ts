import { z } from 'zod';
import { TEXT_LIMITS, tooLong } from '@civicos/shared/data/text-limits';

type LimitedField = keyof typeof TEXT_LIMITS;

/**
 * Typed text that is checked, never rewritten. Superforms writes a schema's
 * parsed value back into the field while you type, so a `.trim()` here strips
 * each space the moment it is typed (#458). Trim where the value is saved.
 */
export const limitedText = (field: LimitedField) =>
	z.string().refine((s) => s.trim().length <= TEXT_LIMITS[field], tooLong(field));

/** `limitedText` that also has to be more than whitespace. */
export const requiredText = (field: LimitedField, message: string) =>
	limitedText(field).refine((s) => s.trim().length > 0, message);
