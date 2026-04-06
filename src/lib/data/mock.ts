import type {
	County,
	Deliberation,
	Conversation,
	UserProfile,
	LearningCard,
	ThemeSummary,
	PopQuizQuestion,
	AboutYouQuestion
} from '$lib/types/mock-data';

export const county: County = {
	name: 'Utah',
	participantCount: 2312
};

export const deliberation: Deliberation = {
	id: 'delib-001',
	title: 'AI & Online Safety',
	question: 'How can Utahns ensure benefits of AI are widely shared and risks are responsibly managed?',
	county
};

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
		description: 'Select the one that best describes you.',
		options: ['Under 18', '18 - 24', '25 - 34', '35 - 44', '45 - 54', '55 - 64', '65 - 84', '85+'],
		multiSelect: false
	},
	{
		id: 'about-002',
		question: 'What is your ethnicity?',
		description: 'Select the one that best describes you.',
		options: ['White or Caucasian', 'Black or African American', 'Hispanic or Latino', 'Asian / Pacific Islander', 'Native American', 'Middle Eastern / North African', 'Multiracial', 'Other'],
		multiSelect: false
	},
	{
		id: 'about-003',
		question: 'What is your gender identity?',
		description: 'Select the one that best describes you.',
		options: ['Male', 'Female', 'Other'],
		multiSelect: false
	},
	{
		id: 'about-004',
		question: 'Which of the following best describes your political leaning?',
		description: 'Select the one that best describes you.',
		options: ['Republican / Conservative', 'Democrat / Progressive / Liberal', 'No Party Preference / Independent'],
		multiSelect: false
	}
];
