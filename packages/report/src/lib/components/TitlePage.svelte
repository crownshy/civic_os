<script lang="ts">
	import { trackEvent } from '@lukulent/svelte-umami';
	import mountains from '../assets/sisters_title.webp';
	import { REPORT_CONFIG } from '../data/report-config';
	import { getNavigate } from '../navigation';
	import RichCopy from './RichCopy.svelte';

	const copy = REPORT_CONFIG.pages.title;

	const navigate = getNavigate();

	function diveIn() {
		trackEvent('dive-in');
		navigate('demogs');
	}
</script>

{#snippet highlight(word: string)}<span class="ai">{word}</span>{/snippet}
{#snippet emphasis(phrase: string)}<span class="highlight">{phrase}</span>{/snippet}

<main class="introPage titlePage">
	<div class="head">
		<h1><RichCopy text={copy.heading} {highlight} /></h1>
	</div>
	<img
		class="mountains"
		src={mountains}
		alt=""
		width={copy.image.width}
		height={copy.image.height}
		fetchpriority="high"
	/>
	<div class="intro">
		<p><RichCopy text={copy.body} highlight={emphasis} /></p>
		<button class="diveIn" type="button" onclick={diveIn}>Dive In</button>
	</div>
</main>

<style>
	/* one centred stack at every width: headline, mountains, copy, button */
	.titlePage {
		display: flex;
		flex-direction: column;
		/* safe: a stack taller than a short viewport top-aligns and scrolls instead of clipping Dive In */
		justify-content: safe center;
		padding-bottom: 24px;
		/* the mountains bleed past the column's edges on mobile */
		overflow-x: clip;
		color: var(--theme-blue);
		text-align: center;
	}
	.head {
		padding: 16px 22px 0;
		position: relative;
		z-index: 2;
	}
	h1 {
		font-family: var(--geom);
		font-weight: 700;
		font-size: clamp(36px, 10.5vw, 52px);
		line-height: 1.16;
		letter-spacing: -0.02em;
		margin: 10px auto 0;
		max-width: 13em;
	}
	.ai {
		background: var(--theme-blue);
		color: #fff;
		border-radius: 0.18em;
		padding: 0.02em 0.18em;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
	}
	.mountains {
		display: block;
		flex: none;
		width: 100%;
		height: auto;
		aspect-ratio: 1800 / 849;
		margin: 0 auto;
	}
	.intro {
		padding: 18px 22px 8px;
	}
	.intro p {
		font-size: 17.5px;
		line-height: 1.5;
		margin: 0 auto 18px;
		max-width: 32em;
	}
	.highlight {
		color: #e76e50;
	}
	.diveIn {
		display: block;
		width: 100%;
		max-width: 420px;
		margin: 0 auto;
		background: var(--theme-blue);
		color: #fff;
		padding: 19px 26px;
		border-radius: 999px;
		font-family: var(--geom);
		font-weight: 700;
		font-size: 21px;
		box-shadow: 0 10px 26px color-mix(in srgb, var(--theme-blue) 45%, transparent);
		transition: transform 0.15s ease;
	}
	.diveIn:active {
		transform: scale(0.97);
	}

	@media (max-width: 659px) {
		.mountains {
			width: 132%;
			margin-inline: -16%;
			/* into the silhouette's own transparent top margin, so it sits right under the headline */
			margin-top: -20px;
		}
	}
	@media (min-width: 660px) {
		.mountains {
			width: min(68%, 620px);
		}
		h1 {
			font-size: 54px;
			line-height: 1.1;
		}
		.intro p {
			font-size: 25px;
			line-height: 1.45;
			margin-bottom: 22px;
			max-width: 34em;
		}
		.diveIn {
			font-size: 22px;
			padding: 21px 26px;
		}
	}
</style>
