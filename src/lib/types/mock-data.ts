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

export interface ConversationEvent {
	slug: string;
	title: string;
	topic: string;
	location: string;
	time: string;
	endTime?: string;
	date: string; // ISO date string for countdown
	format: 'in-person' | 'online';
	description: string;
	fullDescription?: string;
	venueName?: string;
	address?: string;
	duration?: string;
	imageUrl?: string;
	signupUrl?: string;
	joinUrl?: string;
}

export interface AboutYouQuestion {
	id: string;
	question: string;
	description: string;
	options: string[];
	multiSelect: boolean;
}
