<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import SetupCard from './SetupCard.svelte';
	import AddDemographicCategoryDialog from './AddDemographicCategoryDialog.svelte';
	import {
		DEMOGRAPHIC_CATEGORIES,
		type CustomDemographicCategory,
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

	const toggle = (key: DemographicKey, current: boolean) =>
		run(key, () => onToggle!(key, !current));
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
							class="relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed {on
								? 'bg-primary'
								: 'bg-muted-foreground/30'}"
						>
							<span
								class="absolute top-1 size-3 rounded-full bg-white transition-all {on
									? 'left-5'
									: 'left-1'}"
							></span>
						</button>
						<span class="w-7 text-body font-bold">{on ? 'On' : 'Off'}</span>
					</div>
				</div>
			{/each}

			{#each custom as category (category.key)}
				{@const on = category.enabled}
				<div
					class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 px-2 py-5 {on
						? ''
						: 'opacity-50'}"
				>
					<div class="text-body font-bold">{category.name}</div>
					<div class="text-body font-medium">{category.options.join(', ')}</div>
					<div class="flex items-center justify-end gap-3">
						{#if onRemoveCustom}
							<button
								type="button"
								onclick={() => run(category.key, () => onRemoveCustom!(category.key))}
								disabled={pending[category.key]}
								aria-label={`Delete ${category.name}`}
								title="Delete this category"
								class="cursor-pointer p-1 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
							>
								<Trash2 class="size-4" />
							</button>
						{/if}
						<button
							type="button"
							role="switch"
							aria-checked={on}
							aria-label={`Toggle ${category.name}`}
							disabled={!onToggleCustom || pending[category.key]}
							onclick={() => run(category.key, () => onToggleCustom!(category.key, !on))}
							class="relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed {on
								? 'bg-primary'
								: 'bg-muted-foreground/30'}"
						>
							<span
								class="absolute top-1 size-3 rounded-full bg-white transition-all {on
									? 'left-5'
									: 'left-1'}"
							></span>
						</button>
						<span class="w-7 text-body font-bold">{on ? 'On' : 'Off'}</span>
					</div>
				</div>
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
