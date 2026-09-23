import { env } from '$env/dynamic/public';

/**
 * Deployment configuration, which is now only the Polis server.
 *
 * `PUBLIC_CONVERSATION_ID` and `PUBLIC_POLIS_ID` used to sit here too, naming
 * one Conversation and one Polis poll for the whole deployment. They date from
 * before a Campaign was a stored record, and they were the last fallback under
 * a chain that already could not tell which Campaign the URL named, so all they
 * could do was send a participant to the wrong poll quietly. See #421.
 *
 * The server URL survives because it is a property of the deployment rather
 * than of any one Campaign. A Campaign may still override it through
 * `metadata.poll.polisUrl`.
 */
export const config = {
	polisUrl: env.PUBLIC_POLIS_URL || 'https://polis.comhairle.scot'
};
