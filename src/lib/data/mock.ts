import type {
	County,
	Deliberation,
	Statement,
	Conversation,
	UserProfile,
	LearningCard,
	ThemeSummary,
	AvatarOption,
	PopQuizQuestion,
	AboutYouQuestion
} from '$lib/types/mock-data';

export const county: County = {
	name: 'Utah County',
	participantCount: 2312
};

export const deliberation: Deliberation = {
	id: 'delib-001',
	title: 'AI & Online Safety',
	question: 'What should we do to make sure social media helps us, not hurts us?',
	topics: ['Screen Time Limits', 'Platform Accountability', 'Digital Literacy', 'Parental Controls'],
	participantCount: 325,
	county
};

export const statements: Statement[] = [
	{
		id: 'stmt-001',
		text: 'This is a fairly short opinion on the topic.',
		authorAlias: 'Astute Albatross',
		authorColor: '#2952C0',
		deliberationId: 'delib-001',
		postedAt: 'Jan 02 2026'
	},
	{
		id: 'stmt-002',
		text: 'This is a slightly longer opinion on the same topic. Giving it a bit more room to breathe.',
		authorAlias: 'Secret Snake',
		authorColor: '#FC3AA8',
		deliberationId: 'delib-001',
		postedAt: 'Jan 03 2026'
	},
	{
		id: 'stmt-003',
		text: 'And this is a much longer thing. I figure we want to stick to Polis rules and keep statements a bit shorter, but I also like the idea of giving people a bit more room to say what\'s on their mind. Still want to keep it easy to consume and prevent ranting, but yeah. And this is a much longer thing. And this is a much longer thing. And this is a much longer thing. And this is a much longer thing. And this is a much longer thing. And this is a much longer thing.',
		authorAlias: 'Clandestine Coral',
		authorColor: '#2DD4BF',
		deliberationId: 'delib-001',
		postedAt: 'Jan 04 2026'
	},
	{
		id: 'stmt-004',
		text: 'Social media companies should be held more accountable when they harm someone.',
		authorAlias: 'Bold Beaver',
		authorColor: '#2952C0',
		deliberationId: 'delib-001',
		postedAt: 'Jan 05 2026'
	},
	{
		id: 'stmt-005',
		text: 'We need mandatory digital literacy classes in every school starting from middle school.',
		authorAlias: 'Curious Coyote',
		authorColor: '#818CF8',
		deliberationId: 'delib-001',
		postedAt: 'Jan 06 2026'
	},
	{
		id: 'stmt-006',
		text: 'Parents should have better tools to monitor their children\'s online activity without invading privacy.',
		authorAlias: 'Gentle Giraffe',
		authorColor: '#FBBF24',
		deliberationId: 'delib-001',
		postedAt: 'Jan 07 2026'
	},
	{
		id: 'stmt-007',
		text: 'Teens should be involved in creating the rules that govern their online spaces.',
		authorAlias: 'Perceptive Panda',
		authorColor: '#FC3AA8',
		deliberationId: 'delib-001',
		postedAt: 'Jan 08 2026'
	},
	{
		id: 'stmt-008',
		text: 'Age verification should be required for all social media platforms.',
		authorAlias: 'Wise Whale',
		authorColor: '#2DD4BF',
		deliberationId: 'delib-001',
		postedAt: 'Jan 09 2026'
	},
	{
		id: 'stmt-009',
		text: 'We should fund more research into the long-term effects of social media on developing brains.',
		authorAlias: 'Thoughtful Tiger',
		authorColor: '#818CF8',
		deliberationId: 'delib-001',
		postedAt: 'Jan 10 2026'
	},
	{
		id: 'stmt-010',
		text: 'Schools should have phone-free policies during class time.',
		authorAlias: 'Decisive Dolphin',
		authorColor: '#FBBF24',
		deliberationId: 'delib-001',
		postedAt: 'Jan 11 2026'
	}
];

export const conversations: Conversation[] = [
	{
		id: 'conv-001',
		title: 'Conversation 01',
		date: 'Jan 01 2026',
		organization: 'Interfaith Council',
		deliberationId: 'delib-001'
	},
	{
		id: 'conv-002',
		title: 'Conversation 02',
		date: 'Jan 01 2026',
		organization: 'Interfaith Council',
		deliberationId: 'delib-001'
	}
];

export const userProfile: UserProfile = {
	alias: 'Strident Beaver',
	email: 'ada.lovelace@gmail.com',
	avatarIndex: 2,
	zipCode: '84101',
	ethnicity: 'Prefer not to say',
	emailVerified: false
};

export const learningCards: LearningCard[] = [
	{
		id: 'learn-001',
		type: 'did-you-know',
		label: 'DID YOU KNOW...',
		title: '',
		body: '4 in 5 teenagers in Utah are chatting with AI friends online.'
	},
	{
		id: 'learn-002',
		type: 'where-were-at',
		label: "WHERE WE'RE AT",
		title: "Here's how people are responding so far:",
		body: ''
	},
	{
		id: 'learn-003',
		type: 'testimony',
		label: 'TESTIMONY',
		title: '',
		body: '',
		imageUrl: 'https://placehold.co/335x909'
	}
];

export const themeSummaries: ThemeSummary[] = [
	{ label: 'Platform Accountability', percentage: 100 },
	{ label: 'Digital Literacy', percentage: 82 },
	{ label: 'Parental Controls', percentage: 48 },
	{ label: 'Screen Time Limits', percentage: 30 },
	{ label: 'Age Verification', percentage: 12 }
];

export const avatarOptions: AvatarOption[] = [
	{ id: 'av-1', color: '#FFFFFF', emoji: '' },
	{ id: 'av-2', color: '#C4B5FD', emoji: '' },
	{ id: 'av-3', color: '#A5B4FC', emoji: '' },
	{ id: 'av-4', color: '#99F6E4', emoji: '' },
	{ id: 'av-5', color: '#EC4899', emoji: '' },
	{ id: 'av-6', color: '#FCD34D', emoji: '' },
	{ id: 'av-7', color: '#C4B5FD', emoji: '' }
];

export const floatingStatements: string[] = [
	'I think XYZ is important for the future',
	'We should consider doing ABC when doing',
	'Why don\'t we do this instead',
];

export const popQuizQuestions: PopQuizQuestion[] = [
	{
		id: 'quiz-001',
		label: 'POP QUIZ',
		question: 'What percentage of people do you think trust AI more than their elected officials?',
		options: ['Less than 30%', '50-70%', 'More than 70%'],
		correctIndex: 2,
		explanation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus purus mollis, ultrices lorem quis, facilisis mauris. Nulla tortor magna, consequat sed pharetra quis, blandit elementum velit. Curabitur finibus et felis nec vehicula.'
	}
];

export const aboutYouQuestions: AboutYouQuestion[] = [
	{
		id: 'about-001',
		question: 'What is your age?',
		description: 'This information helps us make sure everyone is represented in the conversation. You can revoke access to this at any time.',
		options: ['Under 18', '18 - 24', '25-39', '40-64', '65 and older'],
		multiSelect: false
	},
	{
		id: 'about-002',
		question: 'Which of the following ethnicities do you identify with?',
		description: 'This information helps us make sure everyone is represented in the conversation. You can revoke access to this at any time.',
		options: ['Asian', 'Black', 'White', 'Hispanic', 'Other'],
		multiSelect: false
	},
	{
		id: 'about-003',
		question: 'What is your gender?',
		description: 'This information helps us make sure everyone is represented in the conversation. You can revoke access to this at any time.',
		options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
		multiSelect: false
	}
];
