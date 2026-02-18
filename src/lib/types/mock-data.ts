export interface County {
	name: string;
	participantCount: number;
}

export interface Deliberation {
	id: string;
	title: string;
	question: string;
	topics: string[];
	participantCount: number;
	county: County;
}

export interface Statement {
	id: string;
	text: string;
	authorAlias: string;
	authorColor?: string;
	deliberationId: string;
	postedAt: string;
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

export interface AvatarOption {
	id: string;
	color: string;
	emoji: string;
}

export interface Vote {
	statementId: string;
	value: 'agree' | 'disagree' | 'skip';
}
