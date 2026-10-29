<script lang="ts">
	import { failureMessage } from '$lib/api/describe-failure';
	import SetupCard from './SetupCard.svelte';
	import ToggleRow from './ToggleRow.svelte';
	import {
		PARTICIPANT_ASKS,
		type AskKey,
		type AskToggles
	} from '@civicos/shared/data/participant-asks';

	interface Props {
		title: string;
		subtitle: string;
		/** Current on/off state, read from conversation.metadata.participantAsks. */
		toggles: AskToggles;
		/** Persist a single change. Omit to render read-only. */
		onToggle?: (key: AskKey, next: boolean) => Promise<void>;
	}

	let { title, subtitle, toggles, onToggle }: Props = $props();

	// `saving` blocks a second write to the same row; `heading` is the state a
	// toggle is saving towards, shown until the reloaded data catches up.
	let saving = $state<Record<string, boolean>>({});
	let heading = $state<Record<string, boolean>>({});
	let error = $state<string | null>(null);

	const editable = $derived(!!onToggle);

	function without(record: Record<string, boolean>, key: string) {
		return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
	}

	/** Shared write wrapper: per-key in-flight flag plus one error surface. */
	async function run(key: string, fn: () => Promise<void>, next?: boolean) {
		if (saving[key]) return;
		saving = { ...saving, [key]: true };
		if (next !== undefined) heading = { ...heading, [key]: next };
		error = null;
		try {
			await fn();
		} catch (e) {
			console.error('PatchConversationMetadata failed', e);
			error = failureMessage(e, 'Could not save that change.');
		} finally {
			saving = without(saving, key);
			heading = without(heading, key);
		}
	}
	/** Flip a row towards `next`, fixed at click time so the optimistic state cannot change it. */
	function toggle<K extends string>(
		key: K,
		next: boolean,
		write: (key: K, next: boolean) => Promise<void>
	) {
		return run(key, () => write(key, next), next);
	}
</script>

<SetupCard {title} {subtitle}>
	<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] font-ui">
		{#if error}
			<p class="col-span-full mb-3 text-body text-destructive">{error}</p>
		{/if}

		<div
			class="col-span-full grid grid-cols-subgrid gap-4 px-2 pb-2 text-caption font-semibold text-muted-foreground uppercase"
		>
			<div>Ask</div>
			<div>What participants see</div>
			<div class="text-right">Status</div>
		</div>

		<div class="col-span-full grid grid-cols-subgrid divide-y divide-border">
			{#each PARTICIPANT_ASKS as ask (ask.key)}
				{@const on = heading[ask.key] ?? toggles[ask.key]}
				<ToggleRow
					name={ask.name}
					detail={ask.description}
					note={ask.surfaces}
					{on}
					disabled={!editable}
					busy={saving[ask.key]}
					onToggle={() => toggle(ask.key, !on, onToggle!)}
				/>
			{/each}
		</div>
	</div>
</SetupCard>
