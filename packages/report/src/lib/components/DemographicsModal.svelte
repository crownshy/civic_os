<script lang="ts">
	import { DEMOGRAPHICS, THEME_COLORS } from '../domain/bundled';
	import { modals } from '../state.svelte';
	import ReportDialog from './ReportDialog.svelte';

	const categories = DEMOGRAPHICS.categories;
	const index = $derived(modals.demographics?.index ?? 0);

	const category = $derived(categories[index] ?? categories[0]);
	// each breakdown is a share of only the people who answered that question,
	// not of everyone; the copy spells that denominator out per tab
	const pctAnswered = $derived(Math.round((category.answered / DEMOGRAPHICS.total) * 100));

	let scroller = $state<HTMLDivElement>();
	$effect(() => {
		void index;
		if (scroller) scroller.scrollTop = 0;
	});

	function show(next: number) {
		if (modals.demographics) modals.demographics.index = next;
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
>
	{#snippet header()}
		<div class="gcHead"><div class="ddTitle">{category.label}</div></div>
	{/snippet}

	{#snippet body()}
		<div class="ddTabs label" role="tablist" aria-label="Demographic category">
			{#each categories as cat, i (cat.key)}
				<button type="button" role="tab" aria-selected={i === index} onclick={() => show(i)}>
					{cat.label.toUpperCase()}
				</button>
			{/each}
		</div>
		<div class="cardbody" bind:this={scroller}>
			<p class="ddIntro">
				<b>{pctAnswered}%</b> of respondents provided this information. Of those
				<b>{category.answered}</b> people that provided this information, here is the breakdown:
			</p>
			<div class="ddList">
				{#each category.breakdown as row, i (row.label)}
					<div class="ddRow" style="--rc:{THEME_COLORS[i % THEME_COLORS.length]};--pct:{row.pct}%">
						<span class="ddSwatch"></span>
						<span class="ddLabel">{row.label}</span>
						<span class="ddPct">{row.pct}%</span>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}
</ReportDialog>
