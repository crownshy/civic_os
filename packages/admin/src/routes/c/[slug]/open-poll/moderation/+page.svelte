<script lang="ts">
	import type { PageProps } from './$types';
	import type { ModerationStatus, PolisStatementAux } from '$lib/types/aux';
	import { updateStatementAux } from '$lib/api/aux';

	let { data }: PageProps = $props();

	// Local mutable copy so optimistic accept/reject re-renders without a refetch.
	let statements = $state<PolisStatementAux[]>(data.statements);

	// Reset local state when the load function re-runs (e.g. after invalidation
	// or navigating between conversations).
	$effect(() => {
		statements = data.statements;
	});

	type Filter = 'all' | 'seeded' | 'accepted' | 'pending' | 'rejected';
	let filter = $state<Filter>('all');

	const counts = $derived({
		all: statements.length,
		seeded: statements.filter((s) => s.is_seed).length,
		accepted: statements.filter((s) => s.moderation_status === 'accepted').length,
		pending: statements.filter((s) => s.moderation_status === 'pending').length,
		rejected: statements.filter((s) => s.moderation_status === 'rejected').length
	});

	const visible = $derived.by(() => {
		let list = statements;
		if (filter === 'seeded') list = list.filter((s) => s.is_seed);
		else if (filter !== 'all') list = list.filter((s) => s.moderation_status === filter);
		return [...list].sort((a, b) => b.polis_statement_id - a.polis_statement_id);
	});

	// Track in-flight requests per aux row so the buttons can disable mid-call.
	let pending = $state<Record<string, boolean>>({});

	async function setStatus(row: PolisStatementAux, status: ModerationStatus) {
		if (pending[row.id] || row.moderation_status === status) return;
		pending = { ...pending, [row.id]: true };

		// Optimistic update.
		const prevStatus = row.moderation_status;
		statements = statements.map((s) =>
			s.id === row.id ? { ...s, moderation_status: status } : s
		);

		try {
			const updated = await updateStatementAux(row.id, {
				moderation_status: status
			});
			// Reconcile with server truth.
			statements = statements.map((s) => (s.id === row.id ? updated : s));
		} catch (e) {
			console.error('updateStatementAux failed', e);
			// Roll back.
			statements = statements.map((s) =>
				s.id === row.id ? { ...s, moderation_status: prevStatus } : s
			);
		} finally {
			pending = { ...pending, [row.id]: false };
		}
	}

	const filters: { key: Filter; label: string }[] = [
		{ key: 'all', label: 'all' },
		{ key: 'seeded', label: 'Seeded' },
		{ key: 'accepted', label: 'accepted' },
		{ key: 'pending', label: 'pending' },
		{ key: 'rejected', label: 'rejected' }
	];
</script>

{#snippet statusIcon(status: ModerationStatus, isSeed: boolean)}
	{#if isSeed}
		<span
			class="border-muted-foreground/40 bg-muted-foreground/10 text-muted-foreground text-label inline-flex size-6 items-center justify-center rounded-full border font-bold"
			title="Seed statement"
		>
			A
		</span>
	{:else if status === 'accepted'}
		<span
			class="border-primary bg-primary/10 text-primary text-label inline-flex size-6 items-center justify-center rounded-full border font-bold"
			title="Accepted"
		>
			✓
		</span>
	{:else if status === 'rejected'}
		<span
			class="border-destructive text-destructive text-label inline-flex size-6 items-center justify-center rounded-full border font-bold"
			title="Rejected"
		>
			!
		</span>
	{:else}
		<span
			class="border-destructive/60 bg-destructive/10 text-destructive text-label inline-flex size-6 items-center justify-center rounded-full border font-bold"
			title="Pending"
		>
			?
		</span>
	{/if}
{/snippet}

<div class="flex flex-col gap-6 px-8 py-8">
	{#if data.error}
		<div class="text-destructive text-body">Could not load statements: {data.error}</div>
	{/if}

	<!-- Page heading -->
	<div class="flex max-w-3xl flex-col gap-1">
		<h2 class="text-foreground text-section font-bold">Statements moderation</h2>
		<p class="text-muted-foreground text-caption">Moderate and view all statements.</p>
	</div>

	<!-- Add-a-statement card (UI only for now; seed authoring lands later) -->
	<section
		class="border-ring bg-muted/40 flex max-w-3xl items-center justify-between gap-3 rounded-xl border px-4 py-3"
	>
		<div class="min-w-0">
			<div class="text-foreground text-caption font-bold">Add a statement</div>
			<div class="text-muted-foreground text-label">
				As moderator, you can seed the discussion.
			</div>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<button
				type="button"
				disabled
				class="bg-primary/90 text-primary-foreground text-label inline-flex h-8 cursor-not-allowed items-center rounded-full px-3 font-medium opacity-60"
				title="Seed statement authoring not yet wired up"
			>
				+ Add statement
			</button>
			<button
				type="button"
				disabled
				class="text-primary border-primary text-label inline-flex h-8 cursor-not-allowed items-center rounded-full border bg-white px-3 font-medium opacity-60"
				title="CSV import not yet wired up"
			>
				import csv
			</button>
		</div>
	</section>

	<!-- Status filter chips -->
	<div class="flex flex-wrap items-center gap-1.5">
		{#each filters as f (f.key)}
			<button
				type="button"
				onclick={() => (filter = f.key)}
				class={`text-label inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
					filter === f.key
						? 'bg-foreground/80 text-background'
						: 'bg-muted text-foreground hover:bg-muted/70'
				}`}
			>
				{#if f.key === 'seeded'}
					{@render statusIcon('pending', true)}
				{:else if f.key !== 'all'}
					{@render statusIcon(f.key as ModerationStatus, false)}
				{/if}
				<span>{f.label} · {counts[f.key]}</span>
			</button>
		{/each}
	</div>

	<!-- Table -->
	<div class="max-w-3xl">
		<div
			class="border-foreground text-muted-foreground text-label grid grid-cols-[3rem_2.25rem_1fr_6rem] items-center gap-2 border-b px-3.5 py-2.5 font-semibold tracking-wide uppercase"
		>
			<div>Status</div>
			<div>#</div>
			<div>Statement</div>
			<div>Action</div>
		</div>

		{#if visible.length === 0}
			<p class="text-muted-foreground text-caption px-3.5 py-6 italic">
				No statements match this filter.
			</p>
		{:else}
			{#each visible as row (row.id)}
				<div
					class="border-border grid grid-cols-[3rem_2.25rem_1fr_6rem] items-center gap-2 border-b px-3.5 pt-2.5 pb-3"
				>
					<div>{@render statusIcon(row.moderation_status, row.is_seed)}</div>
					<div class="text-muted-foreground text-label">{row.polis_statement_id}</div>
					<div class="text-foreground text-caption min-w-0">
						{row.statement_text}
					</div>
					<div class="text-caption flex items-center gap-4 font-medium">
						<button
							type="button"
							disabled={pending[row.id] || row.moderation_status === 'accepted'}
							onclick={() => setStatus(row, 'accepted')}
							class="text-primary disabled:opacity-40"
						>
							Accept
						</button>
						<button
							type="button"
							disabled={pending[row.id] || row.moderation_status === 'rejected'}
							onclick={() => setStatus(row, 'rejected')}
							class="text-destructive disabled:opacity-40"
						>
							Reject
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
