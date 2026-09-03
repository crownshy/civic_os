/**
 * Turning records and editorial claims into the words on screen.
 *
 * Nothing here returns HTML: `claimPhrase` hands back the parts of its
 * headline so the component can render the <em> itself, which keeps escaping
 * Svelte's job and this module's output plain text.
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

export interface ClaimPhrase {
	/** flat text, for the table of contents */
	toc: string;
	/** the headline, split so the component renders the emphasis itself */
	head: {
		before: string;
		emphasis: string;
		after: string;
		/** colours the emphasised verb; null leaves it plain italic */
		tone: 'agree' | 'disagree' | null;
	};
}

/** Claims already written as "People agree/disagree …" are used as-is. */
const CLAIM_VERB_RE = /^People (agree|disagree)\b/i;

const TOC_LEAD: Record<InsightDirection, string> = {
	agree: 'AGREE that',
	disagree: 'DISAGREE that',
	divided: 'are DIVIDED on whether',
	mixed: 'are MIXED on whether'
};

/**
 * Turns an editorial claim plus its hand-assigned direction into the table-of-
 * contents line and the section headline.
 *
 * A claim already phrased as "People disagree about whether X" is used verbatim
 * with its verb emphasised, rather than being double-wrapped in another
 * "People X that …" template.
 */
export function claimPhrase(claim: string, direction: InsightDirection): ClaimPhrase {
	const verbatim = claim.match(CLAIM_VERB_RE);
	if (verbatim) {
		const verb = verbatim[1].toLowerCase() as 'agree' | 'disagree';
		const rest = claim.slice(verbatim[0].length);
		return {
			toc: `People ${verb.toUpperCase()}${rest}`,
			head: { before: 'People ', emphasis: verb, after: `${rest}.`, tone: verb }
		};
	}

	// An acronym opening the claim ("AI should …") keeps its capitals; an
	// ordinary word is lowercased so it can follow "…agree that".
	const firstWord = claim.match(/^\S+/)?.[0] ?? '';
	const isAcronym = /^[A-Z]{2,}$/.test(firstWord.replace(/[^A-Za-z]/g, ''));
	const lead = isAcronym ? claim : claim.charAt(0).toLowerCase() + claim.slice(1);

	const known: InsightDirection = TOC_LEAD[direction] ? direction : 'mixed';
	const toc = `People ${TOC_LEAD[known]} ${lead}`;

	switch (known) {
		case 'agree':
		case 'disagree':
			return {
				toc,
				head: {
					before: 'People generally ',
					emphasis: known,
					after: ` that ${lead}.`,
					tone: known
				}
			};
		case 'divided':
			return {
				toc,
				head: {
					before: 'People are ',
					emphasis: 'divided',
					after: ` over whether ${lead}.`,
					tone: null
				}
			};
		default:
			return {
				toc,
				head: {
					before: 'People have ',
					emphasis: 'mixed',
					after: ` views on whether ${lead}.`,
					tone: null
				}
			};
	}
}
