/**
 * Turning records and editorial claims into the words on screen.
 */

import type { InsightDirection, ReportRecord } from './types';

/**
 * Title-cases a raw ALL-CAPS chip, with one special case: a bare "or" stays
 * uppercase right after a comma, since that is the Oregon abbreviation
 * ("Bend, OR"), not the conjunction ("White or Caucasian").
 */
export function titleCaseChip(chip: string): string {
	return chip.toLowerCase().replace(/\b\w+/g, (word, offset: number, whole: string) => {
		if (word === 'or') return whole.slice(0, offset).trimEnd().endsWith(',') ? 'OR' : 'or';
		return word.charAt(0).toUpperCase() + word.slice(1);
	});
}

const EMOJI_OLD_AGE = new Set(['55-64', '65+']);
const EMOJI_SKIN_TONE: Record<string, string> = {
	'WHITE OR CAUCASIAN': '🏻',
	'NATIVE AMERICAN': '🏽'
};

/**
 * Represents a statement's author as a person: gender and age bucket pick the
 * base emoji, race picks a Fitzpatrick skin-tone modifier. Statements not tied
 * to one person (host-seeded, session quotes) get a seed emoji instead.
 */
export function emojiFor(record: ReportRecord): string {
	if (record.origin !== 'participant') return '🌱';

	const old = record.chips.some((chip) => EMOJI_OLD_AGE.has(chip));
	const gender = record.chips.find((c) => c === 'FEMALE' || c === 'MALE' || c === 'OTHER');
	const toneChip = record.chips.find((chip) => EMOJI_SKIN_TONE[chip]);
	const tone = toneChip ? EMOJI_SKIN_TONE[toneChip] : '';

	if (gender === 'FEMALE') return (old ? '👵' : '👩') + tone;
	if (gender === 'MALE') return (old ? '👴' : '👨') + tone;
	return (old ? '🧓' : '🧑') + tone;
}

/**
 * A short, human phrase for who said it (gender and place), drawn straight
 * from the real chip data. Falls back gracefully for host-seeded statements
 * and for participants missing a chip; nothing here is fabricated.
 */
export function demoLineFor(record: ReportRecord): string {
	if (record.origin === 'cocap_seed') return 'Host statement';
	const gender = record.chips.find((c) => c === 'FEMALE' || c === 'MALE' || c === 'OTHER');
	const who = gender === 'FEMALE' ? 'Woman' : gender === 'MALE' ? 'Man' : 'Person';
	if (record.place) return `${who} from ${record.place}`;
	return gender ? who : 'Community member';
}

export function countLabel(statements: number, quotes: number): string {
	const s = `${statements} statement${statements === 1 ? '' : 's'}`;
	const q = `${quotes} quote${quotes === 1 ? '' : 's'}`;
	return `${s} · ${q}`;
}

/** The tooltip on a group's low-data flag. */
export function lowDataTip(votes: number): string {
	return `Low data (${votes} vote${votes === 1 ? '' : 's'})`;
}

/** A claim split so the component renders the emphasised verb itself. */
export interface ClaimPhrase {
	before: string;
	emphasis: string;
	after: string;
	/** colours the emphasised verb */
	tone: InsightDirection;
}

/** Claims already written as "People agree/disagree …" are used as-is. */
const CLAIM_VERB_RE = /^People (agree|disagree)\b/i;

/**
 * Turns an editorial claim plus its hand-assigned direction into the line used
 * both as its section headline and as its table-of-contents entry.
 *
 * A claim already phrased as "People disagree about whether X" is used verbatim,
 * its own verb emphasised and coloured whatever the direction, rather than being
 * double-wrapped in another "People X that …" template.
 */
export function claimPhrase(claim: string, direction: InsightDirection): ClaimPhrase {
	const verbatim = claim.match(CLAIM_VERB_RE);
	if (verbatim) {
		const verb = verbatim[1].toLowerCase() as 'agree' | 'disagree';
		const rest = claim.slice(verbatim[0].length);
		return { before: 'People ', emphasis: verb, after: `${rest}.`, tone: verb };
	}

	// An acronym opening the claim ("AI should …") keeps its capitals; an
	// ordinary word is lowercased so it can follow "…agree that".
	const firstWord = claim.match(/^\S+/)?.[0] ?? '';
	const isAcronym = /^[A-Z]{2,}$/.test(firstWord.replace(/[^A-Za-z]/g, ''));
	const lead = isAcronym ? claim : claim.charAt(0).toLowerCase() + claim.slice(1);

	switch (direction) {
		case 'agree':
		case 'disagree':
			return {
				before: 'People generally ',
				emphasis: direction,
				after: ` that ${lead}.`,
				tone: direction
			};
		case 'divided':
			return {
				before: 'People are ',
				emphasis: 'divided',
				after: ` over whether ${lead}.`,
				tone: 'divided'
			};
		default:
			return {
				before: 'People have ',
				emphasis: 'mixed',
				after: ` views on whether ${lead}.`,
				tone: 'mixed'
			};
	}
}
