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

/**
 * `resource_type` segment for Conversation grants. MUST stay lowercase.
 *
 * The grant endpoint persists this path segment verbatim into
 * `resource_permissions.resource_type`, with no normalisation. Comhairle's own
 * reads compare against `ResourceType::Conversation.as_ref()`, and that enum is
 * `#[strum(serialize_all = "snake_case")]`, so it looks for `conversation`.
 *
 * We used to send `Conversation`. Grants written that way are invisible to
 * `list_for_permitted_user`, so a co-host organization's members got an empty
 * dashboard while this app, which read the rows back using the same wrong
 * casing, showed the co-host as correctly attached. Verified against a local
 * comhairle: the same visibility query returns 1 row for `Conversation` and 0
 * for `conversation`.
 */
export const CONVERSATION_RESOURCE = 'conversation';
