/**
 * Canonical Event type — mirrors the backend API payload.
 *
 * See ADR 0001 for why this exists alongside the legacy `ConversationEvent`
 * type still used by the public site.
 *
 * API ref: GET /conversation/{conversationId}/events
 */

/** Localized text from API — primary content + per-locale translations. */
export interface LocalizedTextContent {
	format: 'plain' | string;
	id: string;
	primaryLocale: string;
}

export interface LocalizedTextTranslation {
	aiGenerated: boolean;
	content: string;
	contentId: string;
	id: string;
	locale: string;
	requiresValidation: boolean;
}

export interface LocalizedText {
	textContent: LocalizedTextContent;
	textTranslations: LocalizedTextTranslation[];
}

/** Structured location — exact shape TBD by backend; permissive for now. */
export interface EventLocation {
	[key: string]: unknown;
}

/** Agenda item — exact shape TBD; permissive for now. */
export interface AgendaItem {
	[key: string]: unknown;
}

export type EventFormat = 'in-person' | 'online' | string;

export interface Event {
	id: string;
	conversationId: string;
	/** Permissive during migration: API returns LocalizedText, raw strings accepted for adapters. */
	name: LocalizedText | string;
	description: LocalizedText | string;
	startTime: string;
	endTime: string;
	format: EventFormat;
	location: EventLocation | null;
	capacity: number | null;
	currentAttendance: number | null;
	agenda: AgendaItem[];
	signupMode: string;
	videoMeetingId: string | null;
	defaultTimeZone: string | null;
	createdAt: string;
	updatedAt?: string;
	/** Frontend-only until backend adds a draft/published state. */
	published?: boolean;
}

/** Event attendance / registration. */
export interface EventAttendance {
	id: string;
	eventId: string;
	userId: string;
	email?: string | null;
	role: string;
	createdAt: string;
	updatedAt?: string;
}
