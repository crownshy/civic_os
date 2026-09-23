/**
 * Mirror a Campaign's co-host list into `Conversation.metadata.cohosts`.
 *
 * A co-host is a permission grant. Turning one into a name to render means
 * `ListResourcePermissions` plus `ListOrganizations`, and both are 401 to the
 * anonymous participant app, so civicos cannot resolve them itself. It used to
 * render `regions.ts`'s static `partners` array instead, which named The Bloom
 * Project on every Campaign created here.
 *
 * Admin holds both calls already, so it writes the display list on every change
 * to the grants. Same pattern as `metadata.org` and `metadata.poll`, and it
 * retires for the same reason: when comhairle exposes co-hosts on the public
 * Conversation payload.
 *
 * Mirroring is best effort. A failure leaves the grants correct and the
 * participant list stale, which is worth a log rather than failing the action
 * the Host actually asked for.
 */

import { COHOST_ROLE, CONVERSATION_RESOURCE } from '$lib/permissions';
import type { CampaignCoHost } from '@civicos/shared/data/place';

type Api = {
	ListOrganizations: (args: { queries: { limit: number } }) => Promise<{
		records: { id: string; name: string; externalUrl?: string | null }[];
	}>;
	ListResourcePermissions: (args: {
		params: { resource_type: string; resource_id: string };
		queries: { limit: number };
	}) => Promise<{ records: { organization_id?: string | null; role_name?: string | null }[] }>;
	PatchConversationMetadata: (
		body: Record<string, unknown>,
		options: { params: { conversation_id: string } }
	) => Promise<unknown>;
};

/**
 * Rebuild the list from the grants and write it.
 *
 * `owningOrgId` leads the list when it is known, because the Host that owns the
 * Campaign is the first name a participant should read. It also holds a
 * `content_editor` grant of its own, so it would otherwise appear twice.
 */
export async function mirrorCoHosts(
	api: Api,
	conversationId: string,
	owningOrgId: string | null
): Promise<void> {
	try {
		const [orgs, permissions] = await Promise.all([
			api.ListOrganizations({ queries: { limit: 200 } }),
			api.ListResourcePermissions({
				params: { resource_type: CONVERSATION_RESOURCE, resource_id: conversationId },
				queries: { limit: 200 }
			})
		]);

		const orgById = new Map(orgs.records.map((o) => [o.id, o]));
		const grantedIds = permissions.records
			.filter((p) => p.organization_id && p.role_name === COHOST_ROLE)
			.map((p) => p.organization_id as string);

		const ordered = [
			...(owningOrgId ? [owningOrgId] : []),
			...grantedIds.filter((id) => id !== owningOrgId)
		];

		const cohosts = ordered.flatMap((id): CampaignCoHost[] => {
			const org = orgById.get(id);
			if (!org?.name?.trim()) return [];

			const entry: CampaignCoHost = { name: org.name.trim() };
			if (org.externalUrl?.trim()) entry.url = org.externalUrl.trim();
			return [entry];
		});

		await api.PatchConversationMetadata(
			{ cohosts },
			{ params: { conversation_id: conversationId } }
		);
	} catch (e) {
		console.error('Mirroring co-hosts into metadata failed', e);
	}
}
