<script lang="ts">
	import { CAMPAIGN_PAGES } from '@civicos/shared/data/place';
	import { invalidate } from '$lib/activity.svelte';
	import { page } from '$app/state';
	import { moderateStatementAux, postSeed, syncStatementAux } from '$lib/api/aux';
	import { setPollStatus, type PollStatusTarget } from '$lib/api/poll-status';
	import { statusFor } from '$lib/conversations';
	import type { PolisStatementAux } from '$lib/types/aux';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import { lockMessage, setQuestionEnabled } from '$lib/api/demographics';
	import StatusCard from './StatusCard.svelte';
	import SeedStatementsCard from './SeedStatementsCard.svelte';

	let { data } = $props();

	const campaign = $derived(data.campaign);
	const conversation = $derived(data.conversation);

	// Same fallback the header badge uses when the conversation didn't resolve.
	const status = $derived(conversation ? statusFor(conversation) : campaign.status);

	// Empty when there is no participant site to link to (no slug, or no
	// participant base configured).
	const pollUrl = $derived(
		campaign.shareUrl
			? `${campaign.shareUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/${CAMPAIGN_PAGES.poll}`
			: ''
	);

	const changeStatus = (next: PollStatusTarget) =>
		setPollStatus({
			api: data.api,
			conversationId: campaign.id,
			next,
			pollLaunched: campaign.pollLaunched,
			polisWorkflowStepId: campaign.polisWorkflowStepId,
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

	const demographics = $derived(data.campaignDemographics);

	async function toggleDemographic(id: string, next: boolean) {
		if (!data.demographicsTarget) throw new Error('This Campaign cannot change its questions.');
		await setQuestionEnabled(data.api, data.demographicsTarget, id, next);
		await invalidate(`campaign:${page.params.slug}`);
	}
</script>

<div class="flex flex-col gap-6 px-8 py-8">
	<StatusCard
		{status}
		{pollUrl}
		participants={data.participants}
		statements={data.statements}
		votes={data.votes}
		onChange={changeStatus}
	/>

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
		defaults={demographics.defaults}
		custom={demographics.custom}
		locked={lockMessage(demographics.lock)}
		live={campaign.pollLaunched === true}
		onToggle={toggleDemographic}
		onToggleCustom={toggleDemographic}
	/>
</div>
