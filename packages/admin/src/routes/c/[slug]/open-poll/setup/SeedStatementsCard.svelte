<script lang="ts">
	import { Plus, X } from '@lucide/svelte';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import AddSeedStatementsDialog from '$lib/components/seeds/AddSeedStatementsDialog.svelte';
	import type { PolisStatementAux } from '$lib/types/aux';

	interface Props {
		/** Every aux row for this poll; the card filters to host seeds itself. */
		statements: PolisStatementAux[];
		/** Post one statement to Polis. The dialog calls it once per statement. */
		onPost: (text: string) => Promise<void>;
		/** Sync the new statements into aux and reload. Runs once, after the last post. */
		onPosted: () => Promise<void>;
		/** Reject removes a seed from rotation; accept puts it back. */
		onSetStatus: (row: PolisStatementAux, decision: 'accept' | 'reject') => Promise<void>;
		/** False when the region has no polis_workflow_step_id. */
		canEdit?: boolean;
	}

	let { statements, onPost, onPosted, onSetStatus, canEdit = true }: Props = $props();

	const seeds = $derived(statements.filter((s) => s.is_seed));
	const active = $derived(seeds.filter((s) => s.moderation_status !== 'rejected'));
	const removed = $derived(seeds.filter((s) => s.moderation_status === 'rejected'));

	let showRemoved = $state(false);
	let error = $state<string | null>(null);

	// Per-row in-flight tracking so one X doesn't disable the whole table.
	let pending = $state<Record<string, boolean>>({});

	const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

	function addedLabel(iso: string): string {
		const then = new Date(iso);
		if (Number.isNaN(then.getTime())) return '';
		const today = new Date();
		const sameDay =
			then.getFullYear() === today.getFullYear() &&
			then.getMonth() === today.getMonth() &&
			then.getDate() === today.getDate();
		return sameDay ? 'Today' : dateFmt.format(then);
	}

	async function setStatus(row: PolisStatementAux, decision: 'accept' | 'reject') {
		if (pending[row.id]) return;
		pending = { ...pending, [row.id]: true };
		error = null;
		try {
			await onSetStatus(row, decision);
		} catch (e) {
			console.error('moderateStatementAux failed', e);
			error = e instanceof Error ? e.message : 'Could not update the statement.';
		} finally {
			pending = { ...pending, [row.id]: false };
		}
	}
</script>

<SetupCard
	title="Seed Statements"
	subtitle="These statements will be shown to most participants for review. As your community adds statements, old statements will show up less often."
>
	<div class="font-ui">
		{#if error}
			<p class="mb-3 text-body text-destructive">{error}</p>
		{/if}

		<div
			class="grid grid-cols-[minmax(0,1fr)_8rem_4rem] gap-4 px-3.5 pb-2 text-caption font-semibold text-muted-foreground uppercase"
		>
			<div>Statements ({active.length})</div>
			<div>Date added</div>
			<div class="text-right">Action</div>
		</div>

		{#each active as row (row.id)}
			<div
				class="grid grid-cols-[minmax(0,1fr)_8rem_4rem] items-center gap-4 border-t border-border px-3.5 py-4"
			>
				<div class="text-body font-semibold text-foreground">{row.statement_text}</div>
				<div class="text-body text-foreground/70">{addedLabel(row.created_at)}</div>
				<div class="text-right">
					<button
						type="button"
						onclick={() => setStatus(row, 'reject')}
						disabled={!canEdit || pending[row.id]}
						title="Remove this statement from rotation"
						aria-label={`Remove statement: ${row.statement_text}`}
						class="cursor-pointer touch-manipulation p-1 text-primary transition-all hover:text-primary/80 active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
					>
						<X class="size-4" />
					</button>
				</div>
			</div>
		{:else}
			<p class="border-border text-muted-foreground text-body border-t px-3.5 py-4">
				No seed statements yet.
			</p>
		{/each}

		<div class="border-t border-border px-3.5 py-4">
			<AddSeedStatementsDialog {onPost} {onPosted} disabled={!canEdit}>
				{#snippet trigger({ open, disabled })}
					<button
						type="button"
						onclick={open}
						{disabled}
						class="inline-flex cursor-pointer items-center gap-1 text-body font-semibold text-primary transition-opacity hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Plus class="size-4" />
						Add New…
					</button>
				{/snippet}
			</AddSeedStatementsDialog>
		</div>

		{#if removed.length}
			<div class="border-t border-border pt-4">
				<button
					type="button"
					onclick={() => (showRemoved = !showRemoved)}
					aria-expanded={showRemoved}
					class="w-full cursor-pointer text-left text-caption font-semibold text-muted-foreground uppercase transition-colors hover:text-foreground active:text-foreground/60"
				>
					{showRemoved ? 'Hide' : 'Show'} removed statements ({removed.length})
				</button>

				{#if showRemoved}
					{#each removed as row (row.id)}
						<div
							class="grid grid-cols-[minmax(0,1fr)_8rem_4rem] items-center gap-4 border-t border-border px-3.5 py-4"
						>
							<div class="text-body font-semibold text-foreground/50 line-through">
								{row.statement_text}
							</div>
							<div class="text-body text-foreground/50">{addedLabel(row.created_at)}</div>
							<div class="text-right">
								<button
									type="button"
									onclick={() => setStatus(row, 'accept')}
									disabled={!canEdit || pending[row.id]}
									class="cursor-pointer text-body text-primary underline transition-opacity hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Reinstate
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</SetupCard>
