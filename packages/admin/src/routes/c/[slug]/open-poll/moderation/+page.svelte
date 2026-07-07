<script lang="ts">
	import type { PageProps } from './$types';
	import type { PolisStatementAux } from '$lib/types/aux';
	import {
		addStatementAuxTheme,
		moderateStatementAux,
		removeStatementAuxTheme,
		syncStatementAux
	} from '$lib/api/aux';
	import { submitSeed } from '$lib/services/polis';
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

	// --- Add seed statements (host authoring) ---
	// We post seeds straight to Polis (is_seed: true) the same way the public
	// civicos app submits statements, then re-sync so the new comment comes back
	// with its real Polis-issued ids. See lib/services/polis.ts for the auth/CORS
	// caveat and the eventual comhairle-endpoint alternative.
	let showAddForm = $state(false);
	let draftText = $state('');
	let addingSeed = $state(false);
	let addError = $state<string | null>(null);

	let csvImporting = $state(false);
	let csvError = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement>();

	const polisId = $derived(data.region?.polisId);
	const stepId = $derived(data.region?.polis_workflow_step_id);
	const canSeed = $derived(!!polisId && !!stepId);

	/** Post each seed to Polis, then pull the new comment(s) back into aux. */
	async function postSeeds(texts: string[]) {
		if (!polisId || !stepId) return;
		for (const t of texts) {
			await submitSeed(polisId, t);
		}
		await syncStatementAux(data.api, stepId);
		await invalidate('open-poll:aux');
	}

	async function addSeed() {
		const text = draftText.trim();
		if (!text || !canSeed || addingSeed) return;
		addingSeed = true;
		addError = null;
		try {
			await postSeeds([text]);
			draftText = '';
			showAddForm = false;
		} catch (e) {
			console.error('submitSeed failed', e);
			addError = e instanceof Error ? e.message : 'Failed to add statement.';
		} finally {
			addingSeed = false;
		}
	}

	async function importCsv(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !canSeed || csvImporting) return;
		csvImporting = true;
		csvError = null;
		try {
			// One statement per line; strip wrapping quotes and a leading header row.
			const lines = (await file.text())
				.split(/\r?\n/)
				.map((l) => l.replace(/^"(.*)"$/, '$1').trim())
				.filter(Boolean);
			if (['statement', 'statements', 'text'].includes(lines[0]?.toLowerCase())) {
				lines.shift();
			}
			if (lines.length) await postSeeds(lines);
		} catch (err) {
			console.error('CSV import failed', err);
			csvError = err instanceof Error ? err.message : 'CSV import failed.';
		} finally {
			csvImporting = false;
			input.value = '';
		}
	}

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
					onclick={() => (showAddForm = !showAddForm)}
					class="rounded-full px-5 py-2.5"
					title="Add a seed statement as moderator"
				>
					<Plus class="size-4" />
					Add statement
				</Button>
				<Button
					variant="outline"
					onclick={() => fileInput?.click()}
					disabled={!canSeed || csvImporting}
					class="text-primary border-primary rounded-full bg-white px-5 py-2.5"
					title="Import seed statements from a CSV (one statement per line)"
				>
					<Upload class="size-4" />
					{csvImporting ? 'Importing…' : 'Import CSV'}
				</Button>
				<input
					bind:this={fileInput}
					type="file"
					accept=".csv,.txt"
					class="hidden"
					onchange={importCsv}
				/>
			</div>
		</div>

		{#if csvError}
			<div class="text-destructive text-caption border-border border-t px-4 py-2">{csvError}</div>
		{/if}

		{#if showAddForm}
			<div class="border-border flex flex-col gap-2 border-t px-4 py-3">
				<textarea
					bind:value={draftText}
					rows="2"
					placeholder="Write a seed statement…"
					class="border-border focus:ring-ring/40 text-body w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
				></textarea>
				{#if !canSeed}
					<p class="text-muted-foreground text-caption">
						Sync at least one statement from Polis first — a new seed needs the conversation's ids.
					</p>
				{/if}
				{#if addError}
					<p class="text-destructive text-caption">{addError}</p>
				{/if}
				<div class="flex justify-end gap-2">
					<Button variant="ghost" onclick={() => (showAddForm = false)} class="rounded-full">
						Cancel
					</Button>
					<Button
						onclick={addSeed}
						disabled={!canSeed || !draftText.trim() || addingSeed}
						class="rounded-full"
					>
						{addingSeed ? 'Posting…' : 'Post seed'}
					</Button>
				</div>
			</div>
		{/if}
	</Card>

	<!-- Status filter chips -->
	<div class="flex flex-wrap items-center gap-1.5">
		{#each filters as f (f.key)}
			<button
				type="button"
				onclick={() => (filter = f.key)}
				class={`font-ui inline-flex cursor-pointer items-center rounded-[30px] px-3 py-2 text-lg font-medium leading-6 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
					filter === f.key
						? 'bg-[#C96442] text-white shadow-sm'
						: 'bg-[#FCF7F6] text-[#C96442] hover:bg-[#F3E7E2]'
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
					class="font-ui text-foreground text-caption grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(11rem,16rem)_auto] items-center gap-4 px-4 py-2 font-semibold uppercase"
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
							<div class="font-ui text-muted-foreground text-label pt-1 text-center tabular-nums">
								{row.polis_statement_id}
							</div>

							<!-- Statement text -->
							<div class="min-w-0">
								<p class="font-ui text-foreground text-lg font-medium leading-6">
									{row.statement_text}
								</p>
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
