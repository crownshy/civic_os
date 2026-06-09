/**
 * Heyform "Leave a review" embed URL.
 * Used by both the end-of-poll Review CTA and the mid-poll "feedback" checkpoint.
 */
export const HEYFORM_EMBED_URL = 'https://heyform.net/f/6mdAdmis';

/**
 * Recognize a Heyform submission postMessage from the embed iframe.
 * Shape isn't fully documented across versions, so we accept either a string
 * sentinel or an object with a recognizable `type`.
 */
export function isHeyformSubmitMessage(data: unknown): boolean {
	if (typeof data === 'string') {
		const lower = data.toLowerCase();
		return lower.includes('heyform') && lower.includes('submit');
	}
	if (typeof data === 'object' && data !== null && 'type' in data) {
		const t = (data as { type: unknown }).type;
		if (typeof t === 'string') {
			return t.startsWith('heyform') || t.includes('form-submit');
		}
	}
	return false;
}
