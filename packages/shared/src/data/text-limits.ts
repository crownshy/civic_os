/**
 * Length caps for Host-authored text.
 *
 * comhairle stores every one of these as unbounded `TEXT` and checks nothing,
 * so these are ours: sized to what the civicos surface that prints each field
 * can hold, not to a column. Admin enforces them on input (#447).
 *
 * `statement` matches civicos's participant composer, so a seed reads like any
 * other statement in the poll.
 */
export const TEXT_LIMITS = {
	campaignTitle: 120,
	keyQuestion: 240,
	/** Counted as plain text, since the stored value is HTML. */
	description: 5000,
	thankYouMessage: 2000,
	statement: 240,
	hostName: 120,
	hostDescription: 1000,
	demographicName: 60,
	demographicOption: 60,
	demographicOptionCount: 12,
	eventName: 120,
	eventDescription: 2000
} as const;

export function tooLong(field: keyof typeof TEXT_LIMITS): string {
	return `Keep this to ${TEXT_LIMITS[field]} characters or fewer.`;
}
