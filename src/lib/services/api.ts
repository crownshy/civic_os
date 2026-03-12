import { createApiClient } from '@crownshy/api-client/client';

export const api = createApiClient('/api', undefined, 'client');

export const config = {
	conversationId: import.meta.env.PUBLIC_CONVERSATION_ID || '',
	inviteId: import.meta.env.PUBLIC_INVITE_ID || '',
	polisUrl: import.meta.env.PUBLIC_POLIS_URL || 'https://polis.comhairle.scot',
	polisId: import.meta.env.PUBLIC_POLIS_ID || '3itaahejzh'
};
