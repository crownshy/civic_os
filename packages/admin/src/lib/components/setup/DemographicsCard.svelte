<script lang="ts">
	import { failureMessage } from '$lib/api/describe-failure';
	import SetupCard from './SetupCard.svelte';
	import ToggleRow from './ToggleRow.svelte';
	import AddDemographicCategoryDialog from './AddDemographicCategoryDialog.svelte';
	import type { CustomDemographicCategory } from '@civicos/shared/data/demographics';

	interface Props {
		title: string;
		subtitle: string;
		/** System questions, and whether this Campaign asks each. */
		defaults: CustomDemographicCategory[];
		/** Why the card is read-only, shown in place of the controls. Null when editable. */
		locked?: string | null;
		/** A launched Campaign applies edits to its live questions. */
		live?: boolean;
		/** Switch a system question on or off for this Campaign. */
		onToggle?: (id: string, next: boolean) => Promise<void>;
		/** The Host's own question bank. */
		custom?: CustomDemographicCategory[];
		/** Toggle a custom category on or off. */
		onToggleCustom?: (id: string, next: boolean) => Promise<void>;
		/** Create a category. Only Campaign Setup passes this; the Open Poll card
		    points the Host here instead (#363). */
		onAddCustom?: (category: CustomDemographicCategory) => Promise<void>;
		/** Update a Host-authored category's name or ordered options. */
		onEditCustom?: (category: CustomDemographicCategory) => Promise<void>;
		/** Take a Host question off this Campaign. It stays in the Host's bank. */
		onRemoveCustom?: (id: string) => Promise<void>;
	}

	let {
		title,
		subtitle,
		defaults,
		locked = null,
		live = false,
		onToggle,
		custom = [],
		onToggleCustom,
		onAddCustom,
		onEditCustom,
		onRemoveCustom
	}: Props = $props();

	let addOpen = $state(false);
	let editingCategory = $state<CustomDemographicCategory | undefined>(undefined);

	// `saving` blocks a second write to the same row; `heading` is the state a
	// toggle is saving towards, shown until the reloaded data catches up.
	let saving = $state<Record<string, boolean>>({});
	let heading = $state<Record<string, boolean>>({});
	let error = $state<string | null>(null);

	const editable = $derived(!!onToggle && !locked);
	const canToggleCustom = $derived(!!onToggleCustom && !locked);
	const canAddCustom = $derived(!locked && !!onAddCustom);

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
			console.error('Saving a demographics change failed', e);
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
			<div>Name</div>
			<div>Options</div>
			<div class="text-right">Status</div>
		</div>

		<div class="col-span-full grid grid-cols-subgrid divide-y divide-border">
			{#each defaults as category (category.id)}
				{@const on = heading[category.id] ?? category.enabled}
				<ToggleRow
					name={category.displayName}
					detail={category.options.join(', ') || (category.answerFormat ?? '')}
					{on}
					disabled={!editable}
					busy={saving[category.id]}
					onToggle={() => toggle(category.id, !on, onToggle!)}
				/>
			{/each}

			{#each custom as category (category.id)}
				{@const on = heading[category.id] ?? category.enabled}
				<ToggleRow
					name={category.displayName}
					detail={category.options.join(', ') || (category.answerFormat ?? '')}
					{on}
					disabled={!canToggleCustom}
					busy={saving[category.id]}
					onToggle={() => toggle(category.id, !on, onToggleCustom!)}
					onEdit={onEditCustom && !locked
						? () => {
								editingCategory = category;
								addOpen = true;
							}
						: undefined}
					onRemove={onRemoveCustom && !locked && on
						? () => run(category.id, () => onRemoveCustom(category.id))
						: undefined}
				/>
			{/each}
		</div>

		{#if canAddCustom}
			<button
				type="button"
				onclick={() => {
					editingCategory = undefined;
					addOpen = true;
				}}
				class="col-span-full flex w-full cursor-pointer items-center gap-1 border-t border-border px-2 py-4 text-body font-bold text-primary transition-colors hover:bg-muted/40 active:bg-foreground/10 active:duration-0"
			>
				Add New…
			</button>
		{/if}
	</div>
</SetupCard>

{#if onAddCustom && onEditCustom && editingCategory}
	<AddDemographicCategoryDialog
		bind:open={addOpen}
		category={editingCategory}
		existing={[...defaults, ...custom]}
		onSave={onEditCustom}
	/>
{:else if onAddCustom}
	<AddDemographicCategoryDialog
		bind:open={addOpen}
		existing={[...defaults, ...custom]}
		onSave={onAddCustom}
	/>
{/if}
