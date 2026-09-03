import { env } from '$env/dynamic/public';

export const config = {
	conversationId: env.PUBLIC_CONVERSATION_ID || '',
	polisUrl: env.PUBLIC_POLIS_URL || 'https://polis.comhairle.scot',
	polisId: env.PUBLIC_POLIS_ID || '3itaahejzh'
};
