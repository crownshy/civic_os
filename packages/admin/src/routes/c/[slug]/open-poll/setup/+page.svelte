<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { moderateStatementAux, postSeed, syncStatementAux } from '$lib/api/aux';
	import type { PolisStatementAux } from '$lib/types/aux';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import {
		readDemographicToggles,
		type DemographicKey
	} from '$lib/config/demographics';
	import StatusCard from './StatusCard.svelte';
	import SeedStatementsCard from './SeedStatementsCard.svelte';

	let { data } = $props();

	const region = $derived(data.region);
	const conversation = $derived(data.conversation);

	// Same fallback the header badge uses when the conversation didn't resolve.
	const isLive = $derived(conversation ? conversation.isLive : region.conversationsActive !== false);

	const pollUrl = $derived(
		`${region.shareUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/poll`
	);

	/**
	 * On/off is a conversation-level switch, not a Polis one. `PolisUpdateConfig`
	 * can write `is_active`, but no endpoint reads it back, so the card would have
	 * no state to render. `conversation.isLive` is readable and already drives the
	 * header badge. See #354.
	 */
	async function setLive(next: boolean) {
		await data.api.UpdateConversation(
			{ is_live: next },
			{ params: { conversation_id: region.conversationId } }
		);
		await invalidate(`region:conversation:${page.params.slug}`);
	}

	const stepId = $derived(region.polis_workflow_step_id);

	/**
	 * Comhairle posts the seed to Polis server-side (owner session, no browser
	 * CORS), but the aux table only learns about it on the next sync, so the
	 * write is post -> sync -> invalidate rather than a single call.
	 */
	async function addSeed(text: string) {
		if (!stepId) return;
		await postSeed(data.api, stepId, text);
		await syncStatementAux(data.api, stepId);
		await invalidate('open-poll:aux');
	}

	async function setSeedStatus(row: PolisStatementAux, decision: 'accept' | 'reject') {
		await moderateStatementAux(data.api, row.id, { decision });
		await invalidate('open-poll:aux');
	}

	const demographics = $derived(readDemographicToggles(conversation?.metadata));

	/**
	 * One shared setting, not a poll-specific one: #363 moves demographics up to
	 * the Campaign so they are collected consistently across every Engagement, so
	 * this writes the same key the Campaign Setup card reads.
	 *
	 * The whole object goes on every write. PatchConversationMetadata merges at
	 * the top level only and replaces nested objects wholesale, so sending a
	 * single key would drop the other three.
	 */
	async function setDemographic(key: DemographicKey, next: boolean) {
		await data.api.PatchConversationMetadata(
			{ demographics: { ...demographics, [key]: next } },
			{ params: { conversation_id: region.conversationId } }
		);
		await invalidate(`region:conversation:${page.params.slug}`);
	}
</script>

<div class="mx-auto flex max-w-6xl flex-col gap-6 px-8 py-8">
	<StatusCard
		{isLive}
		{pollUrl}
		participants={data.participants}
		statements={data.statements}
		votes={data.votes}
		onToggle={setLive}
	/>

	<SetupCard title="Context for Participants" subtitle="Shown on the homepage for this conversation.">
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>

	<SeedStatementsCard
		statements={data.aux}
		onAdd={addSeed}
		onSetStatus={setSeedStatus}
		canEdit={!!stepId}
	/>

	<DemographicsCard
		title="Demographics Questions"
		subtitle="Select from your active demographic categories. To add or edit categories, use the Campaign Setup tab."
		toggles={demographics}
		onToggle={setDemographic}
	/>
</div>
