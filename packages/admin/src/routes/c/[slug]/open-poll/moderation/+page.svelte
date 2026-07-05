<script lang="ts">
	import type { PageProps } from './$types';
	import type { PolisStatementAux } from '$lib/types/aux';
	import {
		addStatementAuxTheme,
		moderateStatementAux,
		removeStatementAuxTheme,
		syncStatementAux
	} from '$lib/api/aux';
	import ThemePicker from '$lib/components/insights/ThemePicker.svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { invalidate } from '$app/navigation';
	import { Check, X, Plus, Upload, RefreshCw } from '@lucide/svelte';

	let { data }: PageProps = $props();

	// Pull latest Polis submissions into the aux table. Submissions don't appear
	// in moderation until this runs — the aux rows are synced, not created live.
	let syncing = $state(false);
	let syncMessage = $state<string | null>(null);

	async function syncFromPolis() {
		const stepId = data.region?.polis_workflow_step_id;
		if (!stepId || syncing) return;
		syncing = true;
		syncMessage = null;
		try {
			const res = await syncStatementAux(data.api, stepId);
			syncMessage = `Synced ${res.synced} statement${res.synced === 1 ? '' : 's'} from Polis.`;
			await invalidate('open-poll:aux');
		} catch (e) {
			console.error('syncStatementAux failed', e);
			syncMessage = 'Sync failed — see console for details.';
		} finally {
			syncing = false;
		}
	}

	// Local mutable copy so optimistic accept/reject re-renders without a refetch.
	let statements = $state<PolisStatementAux[]>(data.statements);

	// Reset local state when the load function re-runs (e.g. after invalidation
	// or navigating between conversations).
	$effect(() => {
		statements = data.statements;
	});

	// Union of every theme used on any row — drives the picker dropdown.
	const availableThemes = $derived.by(() => {
		const set = new Set<string>();
		for (const s of statements) for (const t of s.themes) set.add(t);
		return [...set].sort();
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

	async function setStatus(row: PolisStatementAux, status: 'accepted' | 'rejected') {
		if (pending[row.id] || row.moderation_status === status) return;
		const decision = status === 'accepted' ? 'accept' : 'reject';
		pending = { ...pending, [row.id]: true };

		const prevStatus = row.moderation_status;
		statements = statements.map((s) =>
			s.id === row.id ? { ...s, moderation_status: status } : s
		);

		try {
			const updated = await moderateStatementAux(data.api, row.id, { decision });
			statements = statements.map((s) => (s.id === row.id ? updated : s));
		} catch (e) {
			console.error('moderateStatementAux failed', e);
			statements = statements.map((s) =>
				s.id === row.id ? { ...s, moderation_status: prevStatus } : s
			);
		} finally {
			pending = { ...pending, [row.id]: false };
		}
	}

	async function addTheme(row: PolisStatementAux, theme: string) {
		if (row.themes.includes(theme)) return;
		const prev = row.themes;
		statements = statements.map((s) =>
			s.id === row.id ? { ...s, themes: [...prev, theme] } : s
		);
		try {
			const updated = await addStatementAuxTheme(data.api, row.id, theme);
			statements = statements.map((s) => (s.id === row.id ? updated : s));
		} catch (e) {
			console.error('addStatementAuxTheme failed', e);
			statements = statements.map((s) => (s.id === row.id ? { ...s, themes: prev } : s));
		}
	}

	async function removeTheme(row: PolisStatementAux, theme: string) {
		if (!row.themes.includes(theme)) return;
		const prev = row.themes;
		statements = statements.map((s) =>
			s.id === row.id ? { ...s, themes: prev.filter((t) => t !== theme) } : s
		);
		try {
			const updated = await removeStatementAuxTheme(data.api, row.id, theme);
			statements = statements.map((s) => (s.id === row.id ? updated : s));
		} catch (e) {
			console.error('removeStatementAuxTheme failed', e);
			statements = statements.map((s) => (s.id === row.id ? { ...s, themes: prev } : s));
		}
	}

	const filters: { key: Filter; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'seeded', label: 'Seeded' },
		{ key: 'accepted', label: 'Accepted' },
		{ key: 'pending', label: 'Pending' },
		{ key: 'rejected', label: 'Rejected' }
	];
</script>

<div class="flex flex-col gap-6 px-8 py-8">
	{#if data.error}
		<div class="text-destructive text-body">Could not load statements: {data.error}</div>
	{/if}

	<!-- Page heading -->
	<div class="flex max-w-3xl flex-col gap-1">
		<h2 class="text-foreground text-section font-bold">Statements moderation</h2>
		<p class="text-muted-foreground text-body">Moderate and view all statements.</p>
	</div>

	<!-- Add-a-statement card -->
	<Card
		class="border-ring/60 bg-muted/40 hover:border-ring hover:bg-muted/60 max-w-3xl transition-colors duration-200"
	>
		<div class="flex items-center justify-between gap-3 px-4 py-3">
			<div class="min-w-0">
				<div class="text-foreground text-body font-bold">Add a statement</div>
				<div class="text-muted-foreground text-caption">
					{#if syncMessage}
						{syncMessage}
					{:else}
						As moderator, you can seed the discussion.
					{/if}
				</div>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<Button
					variant="outline"
					onclick={syncFromPolis}
					disabled={syncing || !data.region?.polis_workflow_step_id}
					class="rounded-full px-5 py-2.5"
					title="Pull the latest submitted statements from Polis"
				>
					<RefreshCw class={`size-4 ${syncing ? 'animate-spin' : ''}`} />
					{syncing ? 'Syncing…' : 'Sync from Polis'}
				</Button>
				<Button
					disabled
					class="rounded-full px-5 py-2.5"
					title="Seed statement authoring not yet wired up"
				>
					<Plus class="size-4" />
					Add statement
				</Button>
				<Button
					variant="outline"
					disabled
					class="text-primary border-primary rounded-full bg-white px-5 py-2.5"
					title="CSV import not yet wired up"
				>
					<Upload class="size-4" />
					Import CSV
				</Button>
			</div>
		</div>
	</Card>

	<!-- Status filter chips -->
	<div class="flex flex-wrap items-center gap-1.5">
		{#each filters as f (f.key)}
			<button
				type="button"
				onclick={() => (filter = f.key)}
				class={`text-caption inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 font-medium transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
					filter === f.key
						? 'bg-foreground text-background shadow-sm'
						: 'bg-muted text-foreground hover:bg-muted-foreground/15'
				}`}
			>
				<span>{f.label} · {counts[f.key]}</span>
			</button>
		{/each}
	</div>

	<!-- Statements list (matches Insights StatementSection card style) -->
	<div class="max-w-6xl">
		<Card class="hover:border-muted-foreground/40 shadow-card transition-colors duration-200">
			<div class="flex flex-col">
				<!-- Column headings -->
				<div
					class="text-muted-foreground/60 text-label grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(11rem,16rem)_auto] items-center gap-4 px-4 py-2 font-semibold uppercase"
				>
					<div>#</div>
					<div>Statement</div>
					<div>Theme</div>
					<div class="pr-4">Action</div>
				</div>

				{#if visible.length === 0}
					<p class="text-muted-foreground text-caption px-4 py-6 italic">
						No statements match this filter.
					</p>
				{:else}
					{#each visible as row (row.id)}
						{@const accent = row.is_seed
							? 'bg-muted-foreground/40'
							: row.moderation_status === 'accepted'
								? 'bg-primary'
								: row.moderation_status === 'rejected'
									? 'bg-destructive'
									: 'bg-destructive/60'}
						<div
							class="border-border group hover:bg-muted/40 relative grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(11rem,16rem)_auto] items-start gap-4 border-b py-4 pl-4 transition-colors duration-150"
						>
							<!-- Left accent bar (status color) -->
							<div
								class={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-150 group-hover:w-2 ${accent}`}
							></div>

							<!-- # -->
							<div class="text-muted-foreground pt-0.5 text-center text-caption">
								{row.polis_statement_id}
							</div>

							<!-- Statement text -->
							<div class="min-w-0">
								<p class="text-foreground text-body leading-5">{row.statement_text}</p>
							</div>

							<!-- Theme picker -->
							<div class="min-w-0 pt-0.5">
								<ThemePicker
									themes={row.themes}
									{availableThemes}
									onAddTheme={(theme) => addTheme(row, theme)}
									onRemoveTheme={(theme) => removeTheme(row, theme)}
								/>
							</div>

							<!-- Action -->
							<div class="flex items-center gap-1 self-center pr-4">
								<button
									type="button"
									disabled={pending[row.id] || row.moderation_status === 'accepted'}
									onclick={() => setStatus(row, 'accepted')}
									title="Accept"
									class="text-primary hover:bg-primary/15 inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
								>
									<Check class="size-4" />
								</button>
								<button
									type="button"
									disabled={pending[row.id] || row.moderation_status === 'rejected'}
									onclick={() => setStatus(row, 'rejected')}
									title="Reject"
									class="text-destructive hover:bg-destructive/15 inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
								>
									<X class="size-4" />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</Card>
	</div>
</div>
