/**
 * Resource-permission vocabulary shared by the two surfaces that read or write
 * it: the Campaign's Co-Hosts card (`c/[slug]/overview`) and the Host's
 * Conversations card (`sysadmin/hosts/[id]`).
 *
 * `content_editor` (ConversationContentEditor) is currently the ONLY
 * Conversation-level role in comhairle, so it is what a co-host grant uses.
 * PROVISIONAL: whether this role also propagates Campaign visibility to the
 * co-host's members (the #362 dashboard requirement) is unconfirmed with the
 * backend. If a dedicated co-host/steward role lands, change it here only.
 */
export const COHOST_ROLE = 'content_editor';

/** `resource_type` segment for Conversation grants. */
export const CONVERSATION_RESOURCE = 'Conversation';
