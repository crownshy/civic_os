import type { ConversationWithTranslations } from '@crownshy/api-client/api';

/** The Polis workflow step of a Conversation, plus the Polis conversation it points at. */
export interface PolisStep {
	stepId: string;
	pollId: string;
	serverUrl: string | null;
}

/** The Organization that owns the Conversation. */
export interface CampaignHost {
	id: string;
	name: string;
	url: string | null;
	contactEmail: string | null;
}

/** An Organization holding the co-host role on the Conversation. */
export interface CampaignCoHost {
	id: string;
	name: string;
	roleName: string;
}

/**
 * Presentation copy for a Campaign, read from the Conversation's `metadata` bag.
 *
 * `metadata` is untyped JSON in the generated client, so every field is optional and
 * absent keys read as null/[] rather than throwing. See ADR 0001.
 */
export interface CampaignCopy {
	heroHeader: string | null;
	heroBlurb: string | null;
	question: string | null;
	contextParagraphs: string[];
	about: string[];
	hostMessage: string[];
	hostsBlurb: string | null;
	whatsNext: string | null;
	goDeeper: string | null;
	endCtaJoinDescription: string | null;
	endCtaShareDescription: string | null;
	phaseLabels: { phase1: string; phase2: string; phase3: string } | null;
}

/** A Region plus its Conversation, Polis step and Host. See CONTEXT.md § Campaign. */
export interface Campaign {
	regionId: string;
	/** Region `official_id` — the `[slug]` in `/c/[slug]`. */
	officialId: string;
	/** Region display name, e.g. "Central Oregon". */
	name: string;
	demonym: string | null;
	/** Zip-code prefixes of the Region's areas. */
	zipPrefixes: string[];
	conversationId: string;
	conversation: ConversationWithTranslations;
	/** Null when the Conversation has no workflow step configured with the Polis tool. */
	polis: PolisStep | null;
	host: CampaignHost | null;
	coHosts: CampaignCoHost[];
	shareUrl: string | null;
	copy: CampaignCopy;
}

export type CampaignStatus = 'live' | 'idle' | 'draft';

/** Enough of a Campaign to render the sidebar and dashboard without assembling the whole thing. */
export interface CampaignSummary {
	regionId: string;
	officialId: string;
	name: string;
	title: string;
	shareUrl: string | null;
	status: CampaignStatus;
	conversationId: string | null;
}
