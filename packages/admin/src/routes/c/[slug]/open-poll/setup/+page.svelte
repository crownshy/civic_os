<script lang="ts">
	import { invalidate } from '$lib/activity.svelte';
	import { page } from '$app/state';
	import { moderateStatementAux, postSeed, syncStatementAux } from '$lib/api/aux';
	import { setCampaignLive } from '$lib/api/campaign-live';
	import type { PolisStatementAux } from '$lib/types/aux';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import StatusCard from './StatusCard.svelte';
	import SeedStatementsCard from './SeedStatementsCard.svelte';

	let { data } = $props();

	const campaign = $derived(data.campaign);
	const conversation = $derived(data.conversation);

	// Same fallback the header badge uses when the conversation didn't resolve.
	const isLive = $derived(conversation ? conversation.isLive : campaign.status === 'live');

	// The poll lives at /contribute, not /poll: civicos has no `/poll` route, so
	// the old link 404'd. Empty for Campaigns with no legacy region entry, which
	// have no participant site at all yet.
	const pollUrl = $derived(
		campaign.shareUrl
			? `${campaign.shareUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/contribute`
			: ''
	);

	/**
	 * On/off is a conversation-level switch, not a Polis one. `PolisUpdateConfig`
	 * can write `is_active`, but no endpoint reads it back, so the card would have
	 * no state to render. `conversation.isLive` is readable and already drives the
	 * header badge. See #354.
	 */
	const setLive = (next: boolean) =>
		setCampaignLive({
			api: data.api,
			conversationId: campaign.id,
			next,
			pollLaunched: campaign.pollLaunched,
			reload: async () => {
				await invalidate(`campaign:${page.params.slug}`);
				await invalidate('app:conversations');
			},
			pollIdentity: () => campaign.pollIdentity
		});

	const stepId = $derived(campaign.polisWorkflowStepId);

	/**
	 * Comhairle posts the seed to Polis server-side (owner session, no browser
	 * CORS), but the aux table only learns about it on the next sync. The dialog
	 * posts every statement first and syncs once, so a CSV is not N syncs.
	 */
	async function postOneSeed(text: string) {
		if (!stepId) throw new Error('This conversation has no Polis workflow step.');
		await postSeed(data.api, stepId, text);
	}

	async function syncAfterSeeding() {
		if (!stepId) return;
		await syncStatementAux(data.api, stepId);
		await invalidate('open-poll:aux');
	}

	async function setSeedStatus(row: PolisStatementAux, decision: 'accept' | 'reject') {
		await moderateStatementAux(data.api, row.id, { decision });
		await invalidate('open-poll:aux');
	}

	const defaultDemographics = $derived(data.defaultDemographics);
	const customDemographics = $derived(data.customDemographics);

	async function toggleCustomDemographic(slug: string, next: boolean) {
		if (next) {
			await data.api.CreateConversationDemographics({
				conversationId: campaign.id,
				questionSlug: slug
			});
		} else {
			await data.api.DeleteConversationDemographicsByQuestion(undefined, {
				params: { conversation_id: campaign.id, question_slug: slug }
			});
		}
		await invalidate(`campaign:${page.params.slug}`);
	}
</script>

<div class="flex flex-col gap-6 px-8 py-8">
	<StatusCard
		{isLive}
		{pollUrl}
		participants={data.participants}
		statements={data.statements}
		votes={data.votes}
		onToggle={setLive}
	/>

	<SetupCard
		title="Context for Participants"
		subtitle="Shown on the homepage for this conversation."
	>
		<p class="text-body text-muted-foreground">Coming next.</p>
	</SetupCard>

	<SeedStatementsCard
		statements={data.aux}
		onPost={postOneSeed}
		onPosted={syncAfterSeeding}
		onSetStatus={setSeedStatus}
		canEdit={!!stepId}
	/>

	<DemographicsCard
		title="Demographics Questions"
		subtitle="Select from your active demographic categories. To add or edit categories, use the Campaign Setup tab."
		defaults={defaultDemographics}
		onToggle={toggleCustomDemographic}
		custom={customDemographics}
		onToggleCustom={toggleCustomDemographic}
	/>
</div>
