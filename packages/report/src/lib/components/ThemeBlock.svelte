<script lang="ts">
	import { RECORDS } from '../domain/bundled';
	import { countLabel } from '../domain/copy';
	import { quotesForTheme, statementsForTheme } from '../domain/data';
	import type { Theme } from '../domain/types';

	interface Props {
		theme: Theme;
		/** position in the grid, so the tally staggers block by block */
		index: number;
		onopen: () => void;
	}

	let { theme, index, onopen }: Props = $props();

	const statements = $derived(statementsForTheme(RECORDS, theme).length);
	const quotes = $derived(quotesForTheme(RECORDS, theme).length);
	const total = $derived(statements + quotes);
</script>

<button
	class="theme-block"
	style="--c:{theme.color}"
	aria-label="{theme.short}: {total} perspectives"
	onclick={onopen}
>
	<span class="arrow">→</span>
	<h2>{theme.short}</h2>
	<div class="count label">{countLabel(statements, quotes)}</div>
	<!-- decorative: the counts above already say what this shows -->
	<div class="tally" aria-hidden="true">
		{#each { length: total }, i (i)}
			<i class:q={i >= statements} style="animation-delay:{index * 70 + i * 16}ms"></i>
		{/each}
	</div>
</button>

<style>
	.theme-block {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--c);
		padding: 22px 22px 24px;
		position: relative;
		transition: filter 0.25s ease;
		-webkit-tap-highlight-color: transparent;
	}
	.theme-block h2 {
		font-family: var(--geom);
		font-weight: 700;
		font-size: clamp(26px, 7.4vw, 32px);
		line-height: 1.06;
		letter-spacing: -0.02em;
		margin: 0 0 11px;
		max-width: 13em;
	}
	.theme-block .count {
		color: rgba(255, 255, 255, 0.78);
		margin-bottom: 16px;
	}
	.theme-block .arrow {
		position: absolute;
		top: 24px;
		right: 20px;
		font-size: 17px;
		opacity: 0.45;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
	}
	@media (hover: hover) {
		.theme-block:hover {
			filter: brightness(1.12) saturate(1.05);
		}
		.theme-block:hover .arrow {
			transform: translateX(5px);
			opacity: 1;
		}
	}
	.theme-block:active {
		filter: brightness(0.94);
	}

	/* the tally: one cell per record. filled = poll statement, ring = session quote */
	.tally {
		display: grid;
		grid-template-columns: repeat(auto-fill, 12px);
		gap: 4px;
	}
	.tally i {
		display: block;
		width: 12px;
		height: 12px;
		border-radius: 1.5px;
		background: #fff;
		/* tallyIn is declared globally in app.css; .gbubble on the opinion-groups
		   page uses it too, and Svelte only renames keyframes a component declares */
		animation: tallyIn 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both;
	}
	.tally i.q {
		background: rgba(255, 255, 255, 0.26);
		box-shadow: inset 0 0 0 1.5px #fff;
	}
</style>
