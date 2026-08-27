export interface County {
	name: string;
	participantCount: number;
}

export interface Deliberation {
	id: string;
	title: string;
	question: string;
	county: County;
}

export interface Conversation {
	id: string;
	title: string;
	date: string;
	organization: string;
	deliberationId: string;
}

export interface UserProfile {
	alias: string;
	email: string;
	avatarIndex: number;
	zipCode: string;
	ethnicity: string;
	emailVerified: boolean;
}

export interface LearningCard {
	id: string;
	type: 'did-you-know' | 'where-were-at' | 'testimony';
	label: string;
	title: string;
	body: string;
	imageUrl?: string;
}

export interface ThemeSummary {
	label: string;
	percentage: number;
}

export interface ReportSection {
	title: string;
	subtitle: string;
	slides: ReportSlide[];
}

export interface ReportSlide {
	type: 'overview' | 'introduction' | 'methods' | 'participants' | 'themes' | 'summary';
	title: string;
	content: string[];
}

export interface Vote {
	statementId: string;
	value: 'agree' | 'disagree' | 'skip';
}

export interface PopQuizQuestion {
	id: string;
	label: string;
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

// ConversationEvent moved to @civicos/shared so admin can consume it too.
// Re-exported here for back-compat with civicos imports of $lib/types/mock-data.
export type { ConversationEvent } from '@civicos/shared/types';

export interface AboutYouQuestion {
	id: string;
	question: string;
	description: string;
	options: string[];
	multiSelect: boolean;
}
