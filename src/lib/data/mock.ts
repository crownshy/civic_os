import type {
	County,
	Deliberation,
	Statement,
	Conversation,
	UserProfile,
	LearningCard,
	ThemeSummary,
	AvatarOption
} from '$lib/types/mock-data';

export const county: County = {
	name: 'ABC COUNTY',
	participantCount: 2312
};

export const deliberation: Deliberation = {
	id: 'delib-001',
	title: 'AI & Online Safety',
	question: 'WHAT SHOULD WE DO TO MAKE SURE SOCIAL MEDIA IS HEALTHY FOR TEENS?',
	topics: ['Screen Time Limits', 'Platform Accountability', 'Digital Literacy', 'Parental Controls'],
	participantCount: 325,
	county
};

export const statements: Statement[] = [
	{
		id: 'stmt-001',
		text: '"THIS IS A FAIRLY SHORT OPINION ON THE TOPIC."',
		authorAlias: 'ANONYMOUS ALBATROSS',
		authorColor: '#2952C0',
		deliberationId: 'delib-001',
		postedAt: 'JAN 02 2026'
	},
	{
		id: 'stmt-002',
		text: '"THIS IS A SLIGHTLY LONGER OPINION ON THE SAME TOPIC. GIVING IT A BIT MORE ROOM TO BREATHE."',
		authorAlias: 'SECRET SNAKE',
		authorColor: '#FC3AA8',
		deliberationId: 'delib-001',
		postedAt: 'JAN 03 2026'
	},
	{
		id: 'stmt-003',
		text: '"AND THIS IS A MUCH LONGER THING. I FIGURE WE WANT TO STICK TO POLIS RULES AND KEEP STATEMENTS A BIT SHORTER, BUT I ALSO LIKE THE IDEA OF GIVING PEOPLE A BIT MORE ROOM TO SAY WHAT\'S ON THEIR MIND. STILL WANT TO KEEP IT EASY TO CONSUME AND PREVENT RANTING, BUT YEAH."',
		authorAlias: 'CLANDESTINE CORAL',
		authorColor: '#2DD4BF',
		deliberationId: 'delib-001',
		postedAt: 'JAN 04 2026'
	},
	{
		id: 'stmt-004',
		text: '"SOCIAL MEDIA COMPANIES SHOULD BE HELD MORE ACCOUNTABLE WHEN THEY HARM SOMEONE."',
		authorAlias: 'BOLD BEAVER',
		authorColor: '#2952C0',
		deliberationId: 'delib-001',
		postedAt: 'JAN 05 2026'
	},
	{
		id: 'stmt-005',
		text: '"WE NEED MANDATORY DIGITAL LITERACY CLASSES IN EVERY SCHOOL STARTING FROM MIDDLE SCHOOL."',
		authorAlias: 'CURIOUS COYOTE',
		authorColor: '#818CF8',
		deliberationId: 'delib-001',
		postedAt: 'JAN 06 2026'
	},
	{
		id: 'stmt-006',
		text: '"PARENTS SHOULD HAVE BETTER TOOLS TO MONITOR THEIR CHILDREN\'S ONLINE ACTIVITY WITHOUT INVADING PRIVACY."',
		authorAlias: 'GENTLE GIRAFFE',
		authorColor: '#FBBF24',
		deliberationId: 'delib-001',
		postedAt: 'JAN 07 2026'
	},
	{
		id: 'stmt-007',
		text: '"TEENS SHOULD BE INVOLVED IN CREATING THE RULES THAT GOVERN THEIR ONLINE SPACES."',
		authorAlias: 'PERCEPTIVE PANDA',
		authorColor: '#FC3AA8',
		deliberationId: 'delib-001',
		postedAt: 'JAN 08 2026'
	},
	{
		id: 'stmt-008',
		text: '"AGE VERIFICATION SHOULD BE REQUIRED FOR ALL SOCIAL MEDIA PLATFORMS."',
		authorAlias: 'WISE WHALE',
		authorColor: '#2DD4BF',
		deliberationId: 'delib-001',
		postedAt: 'JAN 09 2026'
	},
	{
		id: 'stmt-009',
		text: '"WE SHOULD FUND MORE RESEARCH INTO THE LONG-TERM EFFECTS OF SOCIAL MEDIA ON DEVELOPING BRAINS."',
		authorAlias: 'THOUGHTFUL TIGER',
		authorColor: '#818CF8',
		deliberationId: 'delib-001',
		postedAt: 'JAN 10 2026'
	},
	{
		id: 'stmt-010',
		text: '"SCHOOLS SHOULD HAVE PHONE-FREE POLICIES DURING CLASS TIME."',
		authorAlias: 'DECISIVE DOLPHIN',
		authorColor: '#FBBF24',
		deliberationId: 'delib-001',
		postedAt: 'JAN 11 2026'
	}
];

export const conversations: Conversation[] = [
	{
		id: 'conv-001',
		title: 'CONVERSATION 01',
		date: 'JAN 01 2026',
		organization: 'INTERFAITH COUNCIL',
		deliberationId: 'delib-001'
	},
	{
		id: 'conv-002',
		title: 'CONVERSATION 02',
		date: 'JAN 01 2026',
		organization: 'INTERFAITH COUNCIL',
		deliberationId: 'delib-001'
	}
];

export const userProfile: UserProfile = {
	alias: 'STRIDENT BEAVER',
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
	'"I THINK XYZ IS IMPORTANT FOR THE FUTURE',
	'"WE SHOULD CONSIDER DOING ABC WHEN DOING',
	'"WHY DON\'T WE DO THIS INSTEAD',
];
