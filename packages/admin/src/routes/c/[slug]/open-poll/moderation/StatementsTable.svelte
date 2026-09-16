<script lang="ts">
	import { Check, X } from '@lucide/svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import type { PolisStatementAux } from '$lib/types/aux';
	import StatementModerationRow from './StatementModerationRow.svelte';

	type Status = 'accepted' | 'rejected';

	interface Props {
		/** The visible (filtered) statements, already ordered. */
		rows: PolisStatementAux[];
		/** Keyed by aux row id. */
		selected: Record<string, boolean>;
		pending: Record<string, boolean>;
		/** Which bulk action is in flight, or null when idle. */
		bulkAction: Status | null;
		onToggleSelect: (id: string, checked: boolean, range: boolean) => void;
		onToggleAll: (checked: boolean) => void;
		onClear: () => void;
		onBulkModerate: (status: Status) => void;
		onModerate: (row: PolisStatementAux, status: Status) => void;
	}

	let {
		rows,
		selected,
		pending,
		bulkAction,
		onToggleSelect,
		onToggleAll,
		onClear,
		onBulkModerate,
		onModerate
	}: Props = $props();

	const bulkWorking = $derived(bulkAction !== null);
	const selectedCount = $derived(rows.filter((r) => selected[r.id]).length);
	const allSelected = $derived(rows.length > 0 && selectedCount === rows.length);
	const someSelected = $derived(selectedCount > 0 && !allSelected);

	// `indeterminate` is a DOM property with no attribute form.
	const indeterminate = (node: HTMLInputElement) => {
		node.indeterminate = someSelected;
	};
</script>

{#snippet selectAll()}
	<input
		type="checkbox"
		checked={allSelected}
		disabled={bulkWorking || rows.length === 0}
		onchange={(e) => onToggleAll(e.currentTarget.checked)}
		{@attach indeterminate}
		aria-label="Select all statements"
		class="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
	/>
{/snippet}

<Card class="shadow-card transition-colors duration-200 hover:border-muted-foreground/40">
	<div class="flex flex-col font-ui">
		<!-- The heading row turns into the bulk bar while rows are selected. The
		     fixed height keeps the list from jumping when a selection starts. -->
		<div class="flex min-h-14 items-center border-b border-border px-4">
			{#if selectedCount > 0}
				<div class="flex w-full flex-wrap items-center gap-4">
					<div class="flex w-6 items-center">{@render selectAll()}</div>
					<span class="text-caption font-medium text-foreground" aria-live="polite">
						{selectedCount} selected
					</span>
					<div class="ml-auto flex items-center gap-2">
						<Button size="sm" disabled={bulkWorking} onclick={() => onBulkModerate('accepted')}>
							{#if bulkAction === 'accepted'}
								<Spinner />
							{:else}
								<Check class="size-4" />
							{/if}
							Accept
						</Button>
						<Button
							size="sm"
							variant="destructive"
							disabled={bulkWorking}
							onclick={() => onBulkModerate('rejected')}
						>
							{#if bulkAction === 'rejected'}
								<Spinner />
							{:else}
								<X class="size-4" />
							{/if}
							Reject
						</Button>
						<Button size="sm" variant="ghost" disabled={bulkWorking} onclick={onClear}>
							Clear
						</Button>
					</div>
				</div>
			{:else}
				<div
					class="grid w-full grid-cols-[1.5rem_1.5rem_minmax(0,1fr)_auto] items-center gap-4 text-caption font-semibold text-foreground uppercase"
				>
					<div class="flex items-center">{@render selectAll()}</div>
					<div>#</div>
					<div>Statement</div>
					<div class="pr-4">Action</div>
				</div>
			{/if}
		</div>

		<div class="relative" aria-busy={bulkWorking}>
			{#if bulkWorking}
				<div
					class="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]"
				>
					<Spinner class="size-6 text-muted-foreground" />
				</div>
			{/if}

			{#if rows.length === 0}
				<p class="px-4 py-6 text-caption text-muted-foreground italic">
					No statements match this filter.
				</p>
			{:else}
				{#each rows as row (row.id)}
					<StatementModerationRow
						{row}
						selected={!!selected[row.id]}
						selectionCount={selectedCount}
						pending={!!pending[row.id]}
						{bulkWorking}
						onToggle={(checked, range) => onToggleSelect(row.id, checked, range)}
						onModerate={(status) => onModerate(row, status)}
					/>
				{/each}
			{/if}
		</div>
	</div>
</Card>
