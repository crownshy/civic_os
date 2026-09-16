<script lang="ts">
	import { DEMOGRAPHICS, THEME_COLORS } from '../domain/bundled';
	import { modals } from '../state.svelte';
	import ReportDialog from './ReportDialog.svelte';

	const categories = DEMOGRAPHICS.categories;
	const index = $derived(modals.demographics?.index ?? 0);

	const category = $derived(categories[index] ?? categories[0]);
	// each breakdown is a share of only the people who answered that question,
	// not of everyone; the copy spells that denominator out per category
	const pctAnswered = $derived(Math.round((category.answered / DEMOGRAPHICS.total) * 100));

	let scroller = $state<HTMLDivElement>();
	$effect(() => {
		void index;
		if (scroller) scroller.scrollTop = 0;
	});

	function show(next: number) {
		if (modals.demographics) modals.demographics.index = next;
	}

	/** Cyclic: the categories have no natural last one, so paging wraps round. */
	function turn(delta: number) {
		show((index + delta + categories.length) % categories.length);
	}

	function close() {
		modals.demographics = null;
	}
</script>

<!-- accent pinned to ink: this modal's chrome stays neutral rather than
     picking up whatever theme colour the page behind is using -->
<ReportDialog
	open={modals.demographics !== null}
	label="Demographics detail"
	accent="var(--ink)"
	onclose={close}
	onpage={turn}
>
	{#snippet header()}
		<div class="gcHead"><div class="ddTitle">{category.label}</div></div>
	{/snippet}

	{#snippet body()}
		<div class="cardbody" bind:this={scroller}>
			<p class="intro">
				<b>{pctAnswered}%</b> of all respondents provided this information. Of the
				<b>{category.answered}</b> people that provided this information, here is the breakdown:
			</p>
			<div class="columns">
				<span class="name"></span>
				<span class="num">In Poll</span>
				<span class="num">Actual</span>
			</div>
			<div>
				{#each category.breakdown as row, i (row.label)}
					<!-- the tint behind a row is sized by the poll share -->
					<div class="row" style="--rc:{THEME_COLORS[i % THEME_COLORS.length]};--pct:{row.pct}%">
						<span class="swatch"></span>
						<span class="name">{row.label}</span>
						<span class="num">{row.pct}%</span>
						<span class="num actual">{row.actual}%</span>
					</div>
				{/each}
			</div>
		</div>
		<div class="tabs label" role="tablist" aria-label="Demographic category">
			{#each categories as cat, i (cat.key)}
				<button type="button" role="tab" aria-selected={i === index} onclick={() => show(i)}>
					{cat.label.toUpperCase()}
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="cardfoot">
			<button aria-label="Previous category" onclick={() => turn(-1)}>
				<svg viewBox="0 0 26 14" aria-hidden="true"
					><path
						d="M25 7H1.6M7.4 1.4L1.2 7l6.2 5.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</button>
			<div class="pos">{index + 1} <em>|</em> {categories.length}</div>
			<button aria-label="Next category" onclick={() => turn(1)}>
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
	.intro {
		margin: 0;
		padding: 20px 22px 4px;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink);
	}
	.intro b {
		font-weight: 700;
		color: var(--agree);
	}
	.columns {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 22px 2px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--ink) 45%, transparent);
	}
	.name {
		flex: 1 1 auto;
		min-width: 0;
	}
	.num {
		width: 48px;
		flex: none;
		text-align: right;
	}
	.row {
		position: relative;
		isolation: isolate;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 22px;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		font-size: 16px;
		overflow: hidden;
		color: var(--ink);
	}
	.row:last-child {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}
	.row::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		width: var(--pct);
		background: color-mix(in srgb, var(--rc) 10%, #fff);
	}
	.swatch {
		width: 11px;
		height: 11px;
		border-radius: 3px;
		flex: none;
		background: var(--rc);
	}
	.row .name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.row .num {
		font-weight: 600;
	}
	.row .actual {
		font-weight: 500;
		color: color-mix(in srgb, var(--ink) 55%, transparent);
	}
	.tabs {
		display: flex;
		flex-wrap: nowrap;
		gap: 6px;
		padding: 14px 16px;
		flex: none;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		border-top: 1px solid color-mix(in srgb, var(--c) 16%, #fff);
	}
	.tabs button {
		flex: none;
		font-size: 10.5px;
		letter-spacing: 0.08em;
		padding: 7px 12px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--home) 10%, #fff);
		color: var(--home);
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}
	/* aria-selected, not aria-pressed: role=tab does not support pressed */
	.tabs button[aria-selected='true'] {
		background: var(--home);
		color: #fff;
		font-weight: 500;
	}
</style>
