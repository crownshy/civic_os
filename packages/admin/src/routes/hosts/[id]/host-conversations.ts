import type { ConversationStatus } from '$lib/conversations';

/** One row of the Host's Conversations card. */
export type HostConversation = {
	id: string;
	/** The `/c/<slug>` segment this Campaign is reachable at. */
	slug: string;
	title: string;
	status: ConversationStatus;
	/** How the Host is attached: it owns the Campaign, or co-hosts it. */
	access: 'owner' | 'cohost';
};

/** A Campaign with no owning Host, offered for assignment on the Host page. */
export type AssignableConversation = {
	id: string;
	title: string;
};
