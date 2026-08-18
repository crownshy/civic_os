<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import SetupCard from './SetupCard.svelte';
	import {
		DEMOGRAPHIC_CATEGORIES,
		type DemographicKey,
		type DemographicToggles
	} from '$lib/config/demographics';

	interface Props {
		title: string;
		subtitle: string;
		/** Current on/off state, read from conversation.metadata.demographics. */
		toggles: DemographicToggles;
		/**
		 * Persist a single change. Omit to render read-only, which is what the
		 * Campaign Setup card does until #363 wires its own write path.
		 */
		onToggle?: (key: DemographicKey, next: boolean) => Promise<void>;
		/** The Add New affordance belongs to Campaign Setup only (#364). */
		canAdd?: boolean;
	}

	let { title, subtitle, toggles, onToggle, canAdd = false }: Props = $props();

	let pending = $state<Partial<Record<DemographicKey, boolean>>>({});
	let error = $state<string | null>(null);

	const editable = $derived(!!onToggle);

	async function toggle(key: DemographicKey, current: boolean) {
		if (!onToggle || pending[key]) return;
		pending = { ...pending, [key]: true };
		error = null;
		try {
			await onToggle(key, !current);
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
			<p class="text-destructive text-body mb-3">{error}</p>
		{/if}

		<div
			class="text-muted-foreground text-caption grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-4 px-2 pb-2 font-semibold uppercase"
		>
			<div>Name</div>
			<div>Options</div>
			<div class="text-right">Status</div>
		</div>

		<div class="divide-border divide-y">
			{#each DEMOGRAPHIC_CATEGORIES as category (category.key)}
				{@const on = toggles[category.key]}
				<div
					class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 px-2 py-5 {on
						? ''
						: 'opacity-50'}"
				>
					<div class="text-body font-bold">{category.name}</div>
					<div class="text-body font-medium">{category.options.join(', ')}</div>
					<div class="flex items-center justify-end gap-3">
						<button
							type="button"
							role="switch"
							aria-checked={on}
							aria-label={`Toggle ${category.name}`}
							disabled={!editable || pending[category.key]}
							onclick={() => toggle(category.key, on)}
							class="relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed {on
								? 'bg-primary'
								: 'bg-muted-foreground/30'}"
						>
							<span
								class="absolute top-1 size-3 rounded-full bg-white transition-all {on
									? 'left-5'
									: 'left-1'}"
							></span>
						</button>
						<span class="text-body w-7 font-bold">{on ? 'On' : 'Off'}</span>
					</div>
				</div>
			{/each}
		</div>

		{#if canAdd}
			<!-- Add-New shell. The category editor modal is #364. -->
			<button
				type="button"
				class="text-primary text-body border-border flex w-full items-center gap-1 border-t px-2 py-4 font-bold"
			>
				<Plus class="size-4" />
				Add New…
			</button>
		{/if}
	</div>
</SetupCard>
