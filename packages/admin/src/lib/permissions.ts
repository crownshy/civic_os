/**
 * Resource-permission vocabulary shared by the two surfaces that read or write
 * it: the Campaign's Co-Hosts card (`c/[slug]/overview`) and the Host's
 * Conversations card (`hosts/[id]`).
 *
 * A co-host grant uses `content_editor` (ConversationContentEditor). Comhairle
 * also has `observer` and `admin` Conversation roles, but those are what its
 * trigger grants the owning Host's members and admins groups, so admin never
 * writes them. If a dedicated co-host/steward role lands, change it here only.
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

type PermissionRow = {
	group_id?: string | null;
	organization_id?: string | null;
	role_name?: string | null;
};

/**
 * The Hosts holding a co-host grant on a Conversation, as org ids.
 *
 * Comhairle grants to an org's user group and reports the row's `group_id`, so
 * the org is found through its `userGroupId`. Older backends reported
 * `organization_id` on the row directly; that is still honoured so this reads
 * both until every deployment is on the group model.
 */
export function cohostOrgIds(
	permissions: PermissionRow[],
	orgs: { id: string; userGroupId?: string | null }[]
): string[] {
	const orgIdByGroup = new Map(
		orgs.flatMap((o) => (o.userGroupId ? [[o.userGroupId, o.id] as const] : []))
	);
	const ids = permissions
		.filter((p) => p.role_name === COHOST_ROLE)
		.map((p) => (p.group_id ? orgIdByGroup.get(p.group_id) : undefined) ?? p.organization_id)
		.filter((id): id is string => !!id);
	return [...new Set(ids)];
}
