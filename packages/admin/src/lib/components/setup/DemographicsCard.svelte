<script lang="ts">
	import SetupCard from './SetupCard.svelte';
	import ToggleRow from './ToggleRow.svelte';
	import AddDemographicCategoryDialog from './AddDemographicCategoryDialog.svelte';
	import {
		DEMOGRAPHIC_CATEGORIES,
		type CustomDemographicCategory,
		type DemographicKey,
		type DemographicToggles
	} from '@civicos/shared/data/demographics';

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
		/** Host-authored categories (#364), stored in metadata.customDemographics. */
		custom?: CustomDemographicCategory[];
		/** Toggle a custom category on or off. */
		onToggleCustom?: (key: string, next: boolean) => Promise<void>;
		/** Create a category. Only Campaign Setup passes this; the Open Poll card
		    points the Host here instead (#363). */
		onAddCustom?: (category: CustomDemographicCategory) => Promise<void>;
		/** Remove a category the Host added. */
		onRemoveCustom?: (key: string) => Promise<void>;
	}

	let {
		title,
		subtitle,
		toggles,
		onToggle,
		custom = [],
		onToggleCustom,
		onAddCustom,
		onRemoveCustom
	}: Props = $props();

	let addOpen = $state(false);

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
			<div>Name</div>
			<div>Options</div>
			<div class="text-right">Status</div>
		</div>

		<div class="divide-y divide-border">
			{#each DEMOGRAPHIC_CATEGORIES as category (category.key)}
				{@const on = toggles[category.key]}
				<ToggleRow
					name={category.name}
					detail={category.options.join(', ')}
					{on}
					disabled={!editable || pending[category.key]}
					onToggle={() => run(category.key, () => onToggle!(category.key, !on))}
				/>
			{/each}

			{#each custom as category (category.key)}
				{@const on = category.enabled}
				<ToggleRow
					name={category.name}
					detail={category.options.join(', ')}
					{on}
					disabled={!onToggleCustom || pending[category.key]}
					onToggle={() => run(category.key, () => onToggleCustom!(category.key, !on))}
					onRemove={onRemoveCustom
						? () => run(category.key, () => onRemoveCustom(category.key))
						: undefined}
				/>
			{/each}
		</div>

		{#if onAddCustom}
			<button
				type="button"
				onclick={() => (addOpen = true)}
				class="flex w-full cursor-pointer items-center gap-1 border-t border-border px-2 py-4 text-body font-bold text-primary"
			>
				Add New…
			</button>
		{/if}
	</div>
</SetupCard>

{#if onAddCustom}
	<AddDemographicCategoryDialog bind:open={addOpen} existing={custom} onSave={onAddCustom} />
{/if}
