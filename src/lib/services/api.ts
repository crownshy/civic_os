import { createApiClient } from '@crownshy/api-client/client';
import { env } from '$env/dynamic/public';

export const api = createApiClient('http://localhost:3000/', undefined, 'client');

export const config = {
	conversationId: env.PUBLIC_CONVERSATION_ID || '',
	inviteId: env.PUBLIC_INVITE_ID || '',
	polisUrl: env.PUBLIC_POLIS_URL || 'https://polis.comhairle.scot',
	polisId: env.PUBLIC_POLIS_ID || '3itaahejzh'
};
