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
	eventDescription: 2000,
	/** Venue name, address lines, city and state of an in-person event. */
	eventAddressLine: 120,
	eventPostalCode: 20,
	/** ISO 3166 code, two or three letters. */
	eventCountryCode: 3,
	/** Long enough for a meeting link with its passcode in the query string. */
	eventLink: 2000,
	agendaTitle: 120,
	agendaPrompt: 240,
	agendaInstructions: 1000,
	faqQuestion: 240,
	faqAnswer: 2000,
	placeName: 80,
	hostWebsite: 200,
	/** The longest address SMTP allows (RFC 5321). */
	email: 254,
	participantName: 100
} as const;

export function tooLong(field: keyof typeof TEXT_LIMITS): string {
	return `Keep this to ${TEXT_LIMITS[field]} characters or fewer.`;
}

/**
 * A statement is one line, the way Polis shows it, so a line break typed or
 * pasted into one becomes a single space (#465).
 */
export function toOneLine(text: string): string {
	return text.replace(/\s*[\r\n]+\s*/g, ' ');
}
