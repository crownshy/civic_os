<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import StatusCard from './StatusCard.svelte';

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

	<SetupCard
		title="Seed Statements"
		subtitle="These statements will be shown to most participants for review. As your community adds statements, old statements will show up less often."
	>
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>

	<SetupCard title="Demographics Questions" subtitle="Select from your active demographic categories.">
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>
</div>
