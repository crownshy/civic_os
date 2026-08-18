<script lang="ts">
	import { Plus, X } from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import type { PolisStatementAux } from '$lib/types/aux';

	interface Props {
		/** Every aux row for this poll; the card filters to host seeds itself. */
		statements: PolisStatementAux[];
		/** Resolve once the new statement is loaded. */
		onAdd: (text: string) => Promise<void>;
		/** Reject removes a seed from rotation; accept puts it back. */
		onSetStatus: (row: PolisStatementAux, decision: 'accept' | 'reject') => Promise<void>;
		/** False when the region has no polis_workflow_step_id. */
		canEdit?: boolean;
	}

	let { statements, onAdd, onSetStatus, canEdit = true }: Props = $props();

	const seeds = $derived(statements.filter((s) => s.is_seed));
	const active = $derived(seeds.filter((s) => s.moderation_status !== 'rejected'));
	const removed = $derived(seeds.filter((s) => s.moderation_status === 'rejected'));

	let showRemoved = $state(false);
	let showAddForm = $state(false);
	let draft = $state('');
	let busy = $state(false);
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

	async function submit() {
		const text = draft.trim();
		if (!text || busy) return;
		busy = true;
		error = null;
		try {
			await onAdd(text);
			draft = '';
			showAddForm = false;
		} catch (e) {
			console.error('postSeed failed', e);
			error = e instanceof Error ? e.message : 'Could not add the statement.';
		} finally {
			busy = false;
		}
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
			<p class="text-destructive text-body mb-3">{error}</p>
		{/if}

		<div
			class="text-muted-foreground text-caption grid grid-cols-[minmax(0,1fr)_8rem_4rem] gap-4 px-3.5 pb-2 font-semibold uppercase"
		>
			<div>Statements ({active.length})</div>
			<div>Date added</div>
			<div class="text-right">Action</div>
		</div>

		{#each active as row (row.id)}
			<div
				class="border-border grid grid-cols-[minmax(0,1fr)_8rem_4rem] items-center gap-4 border-t px-3.5 py-4"
			>
				<div class="text-body text-foreground font-semibold">{row.statement_text}</div>
				<div class="text-body text-foreground/70">{addedLabel(row.created_at)}</div>
				<div class="text-right">
					<button
						type="button"
						onclick={() => setStatus(row, 'reject')}
						disabled={!canEdit || pending[row.id]}
						title="Remove this statement from rotation"
						aria-label={`Remove statement: ${row.statement_text}`}
						class="text-primary cursor-pointer p-1 disabled:cursor-not-allowed disabled:opacity-40"
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

		<div class="border-border border-t px-3.5 py-4">
			{#if showAddForm}
				<div class="flex flex-col gap-2">
					<!-- svelte-ignore a11y_autofocus -->
					<textarea
						bind:value={draft}
						autofocus
						rows="2"
						placeholder="Write a seed statement…"
						class="border-input bg-background text-body focus:ring-ring w-full rounded-[10px] border px-3 py-2 focus:ring-2 focus:outline-none"
					></textarea>
					<div class="flex items-center gap-2">
						<Button onclick={submit} disabled={busy || !draft.trim()}>
							{busy ? 'Adding…' : 'Add statement'}
						</Button>
						<Button
							variant="secondary"
							onclick={() => {
								showAddForm = false;
								draft = '';
							}}
							disabled={busy}
						>
							Cancel
						</Button>
					</div>
				</div>
			{:else}
				<button
					type="button"
					onclick={() => (showAddForm = true)}
					disabled={!canEdit}
					class="text-primary text-body inline-flex cursor-pointer items-center gap-1 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus class="size-4" />
					Add New…
				</button>
			{/if}
		</div>

		{#if removed.length}
			<div class="border-border border-t pt-4">
				<button
					type="button"
					onclick={() => (showRemoved = !showRemoved)}
					aria-expanded={showRemoved}
					class="text-muted-foreground text-caption hover:text-foreground w-full cursor-pointer text-left font-semibold uppercase"
				>
					{showRemoved ? 'Hide' : 'Show'} removed statements ({removed.length})
				</button>

				{#if showRemoved}
					{#each removed as row (row.id)}
						<div
							class="border-border grid grid-cols-[minmax(0,1fr)_8rem_4rem] items-center gap-4 border-t px-3.5 py-4"
						>
							<div class="text-body text-foreground/50 font-semibold line-through">
								{row.statement_text}
							</div>
							<div class="text-body text-foreground/50">{addedLabel(row.created_at)}</div>
							<div class="text-right">
								<button
									type="button"
									onclick={() => setStatus(row, 'accept')}
									disabled={!canEdit || pending[row.id]}
									class="text-primary text-body cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-40"
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
