import { createApiClient } from '@crownshy/api-client/client';
import { PUBLIC_CONVERSATION_ID, PUBLIC_INVITE_ID, PUBLIC_POLIS_URL, PUBLIC_POLIS_ID } from '$env/static/public';

export const api = createApiClient('/api', undefined, 'client');

export const config = {
	conversationId: PUBLIC_CONVERSATION_ID || '',
	inviteId: PUBLIC_INVITE_ID || '',
	polisUrl: PUBLIC_POLIS_URL || 'https://polis.comhairle.scot',
	polisId: PUBLIC_POLIS_ID || '3itaahejzh'
};
