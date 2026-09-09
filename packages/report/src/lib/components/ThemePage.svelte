<script lang="ts">
	import {
		INSIGHTS,
		RECORD_BY_ID,
		THEMES,
		THEME_DESCRIPTIONS,
		THEME_VIEWS
	} from '../domain/bundled';
	import { claimPhrase } from '../domain/copy';
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

	const next = $derived(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);

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

<section class="themePage" style="--c:{theme.color}">
	<div class="l2nav">
		<button onclick={() => navigate('themes')}>← Back</button>
		<button class="nextT" onclick={() => navigate(next.key)}>Go to <b>{next.short}</b> →</button>
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
						<span>{insight.phrase.toc}</span>
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
				<h2 class="insightHead">
					{insight.phrase.head.before}<em
						class={insight.phrase.head.tone ? `ic-${insight.phrase.head.tone}` : undefined}
						>{insight.phrase.head.emphasis}</em
					>{insight.phrase.head.after}
				</h2>
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
	   White throughout; the theme color is used only as an accent (headings,
	   pills, borders, bars), never as a page background. Keeps contrast high
	   and lets every theme's palette read as tinted paper rather than a
	   full-bleed color block.
	   ───────────────────────────────────────────── */
	.themePage {
		background: var(--paper);
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
	.l2nav button {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--c);
		padding: 6px 0;
		transition: opacity 0.2s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.l2nav button:hover {
		opacity: 0.7;
	}
	.l2nav .nextT {
		max-width: 62%;
		text-align: right;
	}
	.l2nav .nextT b {
		font-weight: 600;
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
	}
	.hero .desc {
		font-size: 16.5px;
		line-height: 1.5;
		margin: 0;
		color: var(--ink);
		letter-spacing: -0.003em;
	}
	@media (min-width: 660px) {
		.hero .desc {
			font-size: 18.5px;
		}
	}
	/* ─── "What we learned": table of contents ──────────────────────── */
	.toc {
		margin: 30px 22px 0;
		padding: 22px 0 26px;
		border-top: 1px solid color-mix(in srgb, var(--c) 20%, #fff);
	}
	.toc h2 {
		font-family: var(--geom);
		font-weight: 700;
		color: var(--c);
		font-size: 22px;
		letter-spacing: -0.014em;
		margin: 0 0 14px;
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
		padding: 10px 2px;
		border-bottom: 1px solid color-mix(in srgb, var(--c) 12%, #fff);
		font-size: 14.5px;
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
		margin-top: 12px;
		padding: 4px 2px;
		font-family: var(--mono);
		font-size: 12.5px;
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
		font-size: clamp(21px, 5.6vw, 26px);
		line-height: 1.24;
		letter-spacing: -0.014em;
		margin: 0 auto 18px;
		max-width: 22em;
		text-align: center;
	}
	.insightHead em {
		font-style: italic;
		font-weight: 700;
	}
	.insightHead em.ic-agree {
		color: var(--agree);
	}
	.insightHead em.ic-disagree {
		color: var(--disagree);
	}
	/* ─── All Statements ──────────────────────────────────────────────── */
	.allStatements {
		padding: 38px 22px 4px;
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
</style>
