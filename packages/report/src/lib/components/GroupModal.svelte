<script lang="ts">
	import { GROUPS, GROUP_INFO, GROUP_STATEMENTS, RECORD_BY_ID } from '../domain/bundled';
	import { groupTag, groupsOf } from '../domain/data';
	import { modals } from '../state.svelte';
	import ReportDialog from './ReportDialog.svelte';
	import VoteBars from './VoteBars.svelte';

	let page = $state(0);

	const group = $derived.by(() => {
		const key = modals.group;
		if (!key) return null;
		const base = GROUPS.find((g) => g.key === key);
		return base ? { ...base, ...(GROUP_INFO[key] ?? {}) } : null;
	});

	// page 0 is the hand-written description; pages 1..N are the statements
	// Polis says most define this group, most representative first
	const statements = $derived(modals.group ? (GROUP_STATEMENTS[modals.group] ?? []) : []);
	const total = $derived(1 + statements.length);
	const record = $derived(page > 0 ? RECORD_BY_ID.get(statements[page - 1]?.id) : undefined);

	/**
	 * The same per-group agree% numbers the statement modal shows, but its own
	 * presentation: no "Group A/B/C" prefix (the header already says which group
	 * this is), no legend, and the group in question sorted first with a visibly
	 * thicker bar rather than sitting wherever GROUPS' own order puts it.
	 */
	const rows = $derived.by(() => {
		if (!record?.vote) return [];
		const key = modals.group;
		return groupsOf(GROUPS, record.vote)
			.slice()
			.sort((a, b) => (a.key === key ? -1 : b.key === key ? 1 : 0));
	});

	let scroller = $state<HTMLDivElement>();
	$effect(() => {
		void page;
		if (scroller) scroller.scrollTop = 0;
	});

	function turn(delta: number) {
		const next = page + delta;
		if (next >= 0 && next < total) page = next;
	}

	function close() {
		modals.group = null;
		page = 0;
	}
</script>

<ReportDialog
	open={modals.group !== null}
	label="Group detail"
	variant="groupDialog"
	accent={group?.color || 'var(--home)'}
	onclose={close}
	onpage={turn}
>
	{#snippet header()}
		<div class="gcHead"><div class="ddTitle">{group ? groupTag(group) : ''}</div></div>
	{/snippet}

	{#snippet body()}
		<div class="cardbody" bind:this={scroller}>
			{#if page === 0}
				<div class="gdDesc"><p class="gdText">{group?.description ?? ''}</p></div>
			{:else if record}
				<div class="quotewrap"><blockquote>“{record.text}”</blockquote></div>
				<div class="meta">
					<section>
						<h4>Open Poll Responses</h4>
						<div class="gdVoteCount">{record.vote?.total} votes</div>
						{#each rows as row (row.key)}
							<div class="grow" class:current={row.key === modals.group}>
								<div class="top">
									<span>{groupTag(row)}</span>
									<b>{row.pct}% agree</b>
								</div>
								<VoteBars tally={row} />
							</div>
						{/each}
					</section>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="cardfoot">
			<button aria-label="Previous" disabled={page === 0} onclick={() => turn(-1)}>
				<svg viewBox="0 0 26 14" aria-hidden="true"
					><path
						d="M25 7H1.6M7.4 1.4L1.2 7l6.2 5.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</button>
			<div class="pos">{page + 1} <em>|</em> {total}</div>
			<button aria-label="Next" disabled={page === total - 1} onclick={() => turn(1)}>
				<svg viewBox="0 0 26 14" aria-hidden="true"
					><path
						d="M1 7h23.4M18.6 1.4L24.8 7l-6.2 5.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</button>
		</div>
	{/snippet}
</ReportDialog>

<style>
	/* #gdetail's own take on the shared .meta/.grow/.bar block above (L3 keeps
	   the plain mono/dimmed version), a real Geom heading instead of a small
	   caps label, the vote count moved to its own line under it, group names
	   read as plain black with no "Group A/B/C" prefix (groupTag() drops it,
	   which group this is is already the modal's own header), no disagree/
	   pass/agree legend, and every bar thick. .current (the group the modal
	   is about, sorted first in JS) is what carries color now; its label and
	   the card title (#gcName, reusing .ddTitle) are the only colored text in
	   the whole modal; everything else is plain black/gray. */
	:global(.groupDialog) .meta h4 {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 16px;
		letter-spacing: 0;
		text-transform: none;
		color: var(--ink);
	}

	:global(.groupDialog) .gdVoteCount {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(0, 0, 0, 0.55);
		margin: 2px 0 14px;
	}

	:global(.groupDialog) .grow .top {
		align-items: center;
	}

	:global(.groupDialog) .grow .top span {
		color: var(--ink);
	}

	:global(.groupDialog) .grow .top b {
		color: var(--ink);
	}

	/* the current group's label is a small solid badge (white on theme color)
	   instead of plain colored text, and a touch larger than the others */
	:global(.groupDialog) .grow.current .top span {
		color: #fff;
		background: var(--c);
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 11.5px;
	}

	:global(.groupDialog) .ddTitle {
		color: var(--c);
	}

	:global(.groupDialog) .quotewrap blockquote {
		color: var(--ink);
	}

	:global(.groupDialog) :global(.bar) {
		height: 8px;
	}
</style>
