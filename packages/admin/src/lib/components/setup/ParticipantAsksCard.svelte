<script lang="ts">
	import SetupCard from './SetupCard.svelte';
	import ToggleRow from './ToggleRow.svelte';
	import { PARTICIPANT_ASKS, type AskKey, type AskToggles } from '$lib/config/participant-asks';

	interface Props {
		title: string;
		subtitle: string;
		/** Current on/off state, read from conversation.metadata.participantAsks. */
		toggles: AskToggles;
		/** Persist a single change. Omit to render read-only. */
		onToggle?: (key: AskKey, next: boolean) => Promise<void>;
	}

	let { title, subtitle, toggles, onToggle }: Props = $props();

	let pending = $state<Record<string, boolean>>({});
	let error = $state<string | null>(null);

	const editable = $derived(!!onToggle);

	/** Shared write wrapper: per-key in-flight flag plus one error surface. */
	async function run(key: string, fn: () => Promise<void>) {
		if (pending[key]) return;
		pending = { ...pending, [key]: true };
		error = null;
		try {
			await fn();
		} catch (e) {
			console.error('PatchConversationMetadata failed', e);
			error = e instanceof Error ? e.message : 'Could not save that change.';
		} finally {
			pending = { ...pending, [key]: false };
		}
	}
</script>

<SetupCard {title} {subtitle}>
	<div class="font-ui">
		{#if error}
			<p class="mb-3 text-body text-destructive">{error}</p>
		{/if}

		<div
			class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-4 px-2 pb-2 text-caption font-semibold text-muted-foreground uppercase"
		>
			<div>Ask</div>
			<div>What participants see</div>
			<div class="text-right">Status</div>
		</div>

		<div class="divide-y divide-border">
			{#each PARTICIPANT_ASKS as ask (ask.key)}
				{@const on = toggles[ask.key]}
				<ToggleRow
					name={ask.name}
					detail={ask.description}
					note={ask.surfaces}
					{on}
					disabled={!editable || pending[ask.key]}
					onToggle={() => run(ask.key, () => onToggle!(ask.key, !on))}
				/>
			{/each}
		</div>
	</div>
</SetupCard>
