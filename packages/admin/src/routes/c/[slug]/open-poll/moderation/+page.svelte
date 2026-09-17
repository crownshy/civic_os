<script lang="ts">
	import type { PageProps } from './$types';
	import type { PolisStatementAux } from '$lib/types/aux';
	import {
		moderateStatementAux,
		moderateStatementAuxBatch,
		postSeed,
		syncStatementAux
	} from '$lib/api/aux';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import { untrack } from 'svelte';
	import { invalidate } from '$lib/activity.svelte';
	import { RefreshCw } from '@lucide/svelte';
	import AddSeedStatementsDialog from '$lib/components/seeds/AddSeedStatementsDialog.svelte';
	import StatementsTable from './StatementsTable.svelte';

	let { data }: PageProps = $props();

	type Status = 'accepted' | 'rejected';

	const stepId = $derived(data.campaign.polisWorkflowStepId);

	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

	// Admin has no toast surface, so outcomes land in the line under the heading.
	let notice = $state<{ text: string; error: boolean } | null>(null);

	// Tracks the load data, but stays writable so accept/reject can render
	// optimistically. Any re-run of the load (invalidation, navigating between
	// conversations) discards the local override.
	let statements = $derived(data.statements);

	// --- Sync from Polis ---
	// Submissions don't appear in moderation until this runs: the aux rows are
	// synced, not created live. Keyed by step so switching conversations
	// mid-sync still syncs the new one.
	let syncingStep = $state<string | null>(null);
	const syncing = $derived(syncingStep !== null && syncingStep === stepId);

	async function syncFromPolis({ quiet = false } = {}) {
		const id = stepId;
		if (!id || syncingStep === id) return;
		syncingStep = id;
		if (!quiet) notice = null;
		try {
			const res = await syncStatementAux(data.api, id);
			const skipped = res.skipped_invalid_xid ? ` (${res.skipped_invalid_xid} skipped)` : '';
			if (!quiet || skipped) {
				notice = {
					text: `Synced ${plural(res.synced, 'statement')} from Polis${skipped}.`,
					error: false
				};
			}
			// Spinner stays up through the reload so the button does not flicker.
			await invalidate('open-poll:aux');
		} catch (e) {
			console.error('syncStatementAux failed', e);
			notice = { text: 'Could not sync statements from Polis.', error: true };
		} finally {
			if (syncingStep === id) syncingStep = null;
		}
	}

	// Sync on open and on conversation switch. Not in `load`: every accept/reject
	// invalidates the aux data, which would re-run the sync against Polis each click.
	$effect(() => {
		if (!stepId) return;
		untrack(() => syncFromPolis({ quiet: true }));
	});

	// --- Seeds ---
	// Comhairle posts to Polis server-side, so no Polis credentials in the browser.
	// The aux table only learns about a seed on the next sync.
	async function postOneSeed(text: string) {
		if (!stepId) throw new Error('This conversation has no Polis workflow step.');
		await postSeed(data.api, stepId, text);
	}

	async function syncAfterSeeding() {
		if (!stepId) return;
		await syncStatementAux(data.api, stepId);
		await invalidate('open-poll:aux');
	}

	// --- Filters ---
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

	const filters: { key: Filter; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'seeded', label: 'Seeded' },
		{ key: 'accepted', label: 'Accepted' },
		{ key: 'pending', label: 'Pending' },
		{ key: 'rejected', label: 'Rejected' }
	];

	// --- Selection ---
	// Keyed by aux row id. Select-all and the bulk actions only reach visible rows,
	// so a selection made under one filter never acts on rows hidden by another.
	let selected = $state<Record<string, boolean>>({});
	const selectedVisible = $derived(visible.filter((r) => selected[r.id]));

	// Anchor for shift-click ranges: the last plainly clicked row. Ranges follow
	// `visible`, so they match the order on screen rather than the data order.
	let anchorId = $state<string | null>(null);

	function toggleSelect(id: string, checked: boolean, range = false) {
		if (range && anchorId !== null && anchorId !== id) {
			const order = visible.map((r) => r.id);
			const a = order.indexOf(anchorId);
			const b = order.indexOf(id);
			if (a !== -1 && b !== -1) {
				const [lo, hi] = a < b ? [a, b] : [b, a];
				const next = { ...selected };
				for (let i = lo; i <= hi; i++) next[order[i]] = true;
				selected = next;
				// Anchor stays put so another shift-click can resize the range.
				return;
			}
		}
		selected = { ...selected, [id]: checked };
		anchorId = id;
	}

	function toggleSelectAll(checked: boolean) {
		const next = { ...selected };
		for (const r of visible) next[r.id] = checked;
		selected = next;
	}

	function clearSelection() {
		selected = {};
		anchorId = null;
	}

	// --- Moderation ---
	let bulkAction = $state<Status | null>(null);
	let pending = $state<Record<string, boolean>>({});

	async function bulkModerate(status: Status) {
		const targets = selectedVisible.filter((r) => r.moderation_status !== status);
		if (bulkAction !== null) return;
		if (!targets.length) {
			clearSelection();
			return;
		}
		bulkAction = status;
		notice = null;

		const ids = targets.map((t) => t.id);
		const idSet = new Set(ids);
		statements = statements.map((s) => (idSet.has(s.id) ? { ...s, moderation_status: status } : s));

		try {
			const res = await moderateStatementAuxBatch(data.api, {
				ids,
				decision: status === 'accepted' ? 'accept' : 'reject'
			});
			notice = res.failed.length
				? { text: `${res.failed.length} of ${targets.length} failed to update.`, error: true }
				: { text: `${plural(targets.length, 'statement')} ${status}.`, error: false };
		} catch (e) {
			console.error('moderateStatementAuxBatch failed', e);
			notice = { text: 'Could not update the selected statements.', error: true };
		}
		clearSelection();
		// Server truth, which also undoes the optimistic flip for any row that failed.
		await invalidate('open-poll:aux');
		bulkAction = null;
	}

	async function setStatus(row: PolisStatementAux, status: Status) {
		// A row inside the selection acts on the whole selection, like the bulk bar.
		if (selected[row.id]) return bulkModerate(status);
		if (pending[row.id] || row.moderation_status === status) return;
		pending = { ...pending, [row.id]: true };

		const prevStatus = row.moderation_status;
		statements = statements.map((s) => (s.id === row.id ? { ...s, moderation_status: status } : s));

		try {
			const updated = await moderateStatementAux(data.api, row.id, {
				decision: status === 'accepted' ? 'accept' : 'reject'
			});
			statements = statements.map((s) => (s.id === row.id ? updated : s));
			await invalidate('open-poll:aux');
		} catch (e) {
			console.error('moderateStatementAux failed', e);
			statements = statements.map((s) =>
				s.id === row.id ? { ...s, moderation_status: prevStatus } : s
			);
			notice = { text: 'Could not update the statement.', error: true };
		} finally {
			pending = { ...pending, [row.id]: false };
		}
	}
</script>

<div class="flex flex-col gap-6 px-8 py-8">
	{#if data.error}
		<div class="text-body text-destructive">Could not load statements: {data.error}</div>
	{/if}

	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex max-w-3xl flex-col gap-1">
			<h2 class="font-display text-h4 font-semibold text-foreground md:text-h3">
				Statements moderation
			</h2>
			<p
				class={`text-body-lg ${notice?.error ? 'text-destructive' : 'text-muted-foreground'}`}
				aria-live="polite"
			>
				{notice?.text ?? 'Moderate and view all statements.'}
			</p>
		</div>
		<div class="flex shrink-0 flex-wrap items-center gap-2">
			<Button
				variant="secondary"
				onclick={() => syncFromPolis()}
				disabled={syncing || !stepId}
				title="Pull the latest submitted statements from Polis"
			>
				{#if syncing}
					<Spinner />
				{:else}
					<RefreshCw class="size-4" />
				{/if}
				{syncing ? 'Syncing…' : 'Sync from Polis'}
			</Button>
			<AddSeedStatementsDialog
				disabled={!stepId}
				onPost={postOneSeed}
				onPosted={syncAfterSeeding}
				onDone={(n) => (notice = { text: `Added ${plural(n, 'seed statement')}.`, error: false })}
			/>
		</div>
	</div>

	{#if !stepId}
		<p class="text-caption text-muted-foreground">
			This conversation has no Polis workflow step, so seed statements cannot be added.
		</p>
	{/if}

	<!-- Status filter chips -->
	<div class="flex flex-wrap items-center gap-1.5">
		{#each filters as f (f.key)}
			<button
				type="button"
				onclick={() => (filter = f.key)}
				class={`inline-flex cursor-pointer items-center rounded-[30px] px-3 py-2 font-ui text-body-lg font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
					filter === f.key
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'bg-primary-subtle text-primary hover:bg-primary-subtle-hover'
				}`}
			>
				<span>{f.label} · {counts[f.key]}</span>
			</button>
		{/each}
	</div>

	<StatementsTable
		rows={visible}
		{selected}
		{pending}
		{bulkAction}
		onToggleSelect={toggleSelect}
		onToggleAll={toggleSelectAll}
		onClear={clearSelection}
		onBulkModerate={bulkModerate}
		onModerate={setStatus}
	/>
</div>
