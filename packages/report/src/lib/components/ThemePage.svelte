<script lang="ts">
	import { INSIGHTS, RECORD_BY_ID, THEME_DESCRIPTIONS, THEME_VIEWS } from '../domain/bundled';
	import { claimPhrase, type ClaimPhrase } from '../domain/copy';
	import type { ReportRecord, Theme } from '../domain/types';
	import { getNavigate, getOpenStatement } from '../navigation';
	import InsightCarousel from './InsightCarousel.svelte';
	import StatementCard from './StatementCard.svelte';

	let { theme }: { theme: Theme } = $props();

	const navigate = getNavigate();
	const openStatement = getOpenStatement();

	const view = $derived(THEME_VIEWS[theme.key]);
	const statements = $derived(view.statements);
	const description = $derived(THEME_DESCRIPTIONS[theme.key]?.description ?? '');

	/** Insights whose cited records still resolve; one that cites nothing is skipped. */
	const insights = $derived(
		(INSIGHTS[theme.key] ?? [])
			.map((insight) => ({
				...insight,
				phrase: claimPhrase(insight.claim, insight.direction),
				records: insight.ids
					.map((id) => RECORD_BY_ID.get(id))
					.filter((r): r is ReportRecord => Boolean(r))
			}))
			.filter((insight) => insight.records.length > 0)
	);

	const plural = (n: number) => `${n} statement${n === 1 ? '' : 's'}`;

	let sections = $state<HTMLElement[]>([]);
	let allStatements = $state<HTMLElement>();

	const behavior = () =>
		matchMedia('(prefers-reduced-motion: reduce)').matches
			? ('auto' as const)
			: ('smooth' as const);

	const scrollTo = (el?: HTMLElement) =>
		el?.scrollIntoView({ behavior: behavior(), block: 'start' });
</script>

<!-- the same words in the table of contents and the headline it jumps to -->
{#snippet claim(phrase: ClaimPhrase)}
	{phrase.before}<em class="ic-{phrase.tone}">{phrase.emphasis}</em>{phrase.after}
{/snippet}

<section class="themePage" style="--c:{theme.color}">
	<div class="l2nav">
		<button onclick={() => navigate('themes')}>← Back</button>
		<a class="nextT" href="https://cocap.us/ai" target="_blank" rel="noopener"
			>Learn more at COCAP.US<svg viewBox="0 0 16 16" aria-hidden="true"
				><path
					d="M4.5 11.5 11.5 4.5M5.5 4.5H11.5V10.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			></a
		>
	</div>

	<div class="hero">
		<h1>{theme.short}</h1>
		<div class="count label">{plural(statements.length)}</div>
		<p class="desc">{description}</p>
	</div>

	{#if insights.length}
		<nav class="toc" aria-label="What we learned">
			<h2>What we learned</h2>
			<div class="tocList">
				{#each insights as insight, i (insight.claim)}
					<button class="tocItem" onclick={() => scrollTo(sections[i])}>
						<span>{@render claim(insight.phrase)}</span>
						<span class="arrow">→</span>
					</button>
				{/each}
				<button class="tocSeeAll" onclick={() => scrollTo(allStatements)}>
					See all {plural(statements.length)} →
				</button>
			</div>
		</nav>
	{/if}

	<div class="insightsWrap">
		{#each insights as insight, i (insight.claim)}
			<section class="insight" bind:this={sections[i]}>
				<h2 class="insightHead">{@render claim(insight.phrase)}</h2>
				<InsightCarousel>
					{#each insight.records as record (record.id)}
						<StatementCard
							{record}
							onopen={() => openStatement(view.items, view.items.indexOf(record))}
						/>
					{/each}
				</InsightCarousel>
			</section>
		{/each}
	</div>

	<section class="allStatements" bind:this={allStatements}>
		<h2>All Statements</h2>
		<div class="allList">
			{#each statements as record (record.id)}
				<StatementCard
					{record}
					onopen={() => openStatement(view.items, view.items.indexOf(record))}
				/>
			{/each}
		</div>
	</section>

	<div class="lane-end">{plural(statements.length)} in this theme</div>
</section>

<style>
	/* ─────────────────────────────────────────────
	   LEVEL 2: THEME VIEWER
	   The theme color is used only as an accent (headings, pills, borders,
	   bars), never as a page background.
	   ───────────────────────────────────────────── */
	.themePage {
		color: var(--ink);
		min-height: 100vh;
		min-height: 100dvh;
		position: relative;
	}
	.l2nav {
		position: sticky;
		top: 0;
		z-index: 30;
		height: var(--nav-h);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 18px;
		background: var(--paper);
		border-top: 4px solid var(--c);
		box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--c) 16%, #fff);
	}
	.l2nav button,
	.l2nav .nextT {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--c);
		padding: 6px 0;
		text-decoration: none;
		transition: opacity 0.2s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.l2nav button:hover,
	.l2nav .nextT:hover {
		opacity: 0.7;
	}
	.l2nav .nextT {
		max-width: 70%;
		text-align: right;
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.l2nav .nextT svg {
		width: 11px;
		height: 11px;
		flex: none;
		stroke: currentColor;
		stroke-width: 1.9;
		fill: none;
	}
	.hero {
		padding: 28px 22px 8px;
	}
	.hero h1 {
		font-family: var(--geom);
		font-weight: 700;
		font-size: clamp(30px, 9vw, 40px);
		line-height: 1.02;
		letter-spacing: -0.024em;
		margin: 0 0 9px;
		color: var(--c);
	}
	.hero .count {
		color: color-mix(in srgb, var(--c) 60%, #000);
		margin-bottom: 18px;
		font-size: 13px;
		letter-spacing: 0.1em;
	}
	.hero .desc {
		font-size: 16.5px;
		line-height: 1.5;
		margin: 0;
		color: var(--ink);
		letter-spacing: -0.003em;
	}
	/* ─── "What we learned": table of contents ──────────────────────── */
	.toc {
		margin: 30px 22px 0;
		padding: 22px 0 26px;
		border-top: 1px solid color-mix(in srgb, var(--c) 20%, #fff);
	}
	/* the same size as the insight headlines */
	.toc h2 {
		font-family: var(--geom);
		font-weight: 700;
		color: var(--c);
		font-size: 21px;
		letter-spacing: -0.014em;
		margin: 0 0 16px;
	}
	.tocList {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.tocItem {
		display: flex;
		align-items: baseline;
		gap: 8px;
		width: 100%;
		text-align: left;
		padding: 13px 2px;
		border-bottom: 1px solid color-mix(in srgb, var(--c) 12%, #fff);
		font-size: 17px;
		line-height: 1.4;
		color: var(--ink);
		transition: opacity 0.15s ease;
	}
	.tocItem:hover {
		opacity: 0.65;
	}
	.tocItem .arrow {
		flex: none;
		color: var(--c);
		margin-left: auto;
		padding-left: 8px;
	}
	.tocSeeAll {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		text-align: left;
		margin-top: 14px;
		padding: 5px 2px;
		font-family: var(--mono);
		font-size: 14px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--c);
	}
	.tocSeeAll:hover {
		opacity: 0.7;
	}
	/* ─── insights: claim header + carousel of statement cards ──────── */
	.insightsWrap {
		padding: 6px 0 8px;
	}
	.insight {
		padding: 34px 22px 6px;
		scroll-margin-top: calc(var(--nav-h) + 18px);
	}
	.insightHead {
		font-family: var(--geom);
		font-weight: 700;
		color: var(--c);
		font-size: 21px;
		line-height: 1.24;
		letter-spacing: -0.014em;
		margin: 0 auto 18px;
		max-width: 22em;
		text-align: center;
	}
	/* the key verb, bold and coloured, the same in the headline and its TOC line */
	.insightHead em,
	.tocItem em {
		font-style: normal;
		font-weight: 700;
	}
	em.ic-agree {
		color: var(--agree);
	}
	em.ic-disagree {
		color: var(--disagree);
	}
	em.ic-divided,
	em.ic-mixed {
		color: var(--theme-blue);
	}
	/* ─── All Statements ──────────────────────────────────────────────── */
	.allStatements {
		padding: 38px 16px 4px;
	}
	.allStatements h2 {
		font-family: var(--geom);
		font-weight: 700;
		color: var(--c);
		font-size: 24px;
		letter-spacing: -0.014em;
		margin: 0 0 20px;
		text-align: center;
	}
	.allList {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.lane-end {
		padding: 34px 22px 60px;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--c) 55%, #000);
		text-align: center;
	}
	@media (min-width: 660px) {
		.l2nav button,
		.l2nav .nextT {
			font-size: 14px;
			letter-spacing: 0.09em;
		}
		.hero .count {
			font-size: 19px;
			letter-spacing: 0.06em;
			margin-bottom: 24px;
		}
		.hero .desc {
			font-size: 20.5px;
		}
		.toc h2 {
			font-size: 29px;
			margin-bottom: 20px;
		}
		.tocItem {
			padding: 16px 2px;
			font-size: 20px;
		}
		.tocSeeAll {
			font-size: 15px;
		}
		.insightHead {
			font-size: 29px;
		}
	}
</style>
