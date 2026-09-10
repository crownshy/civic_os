<script lang="ts">
	import { trackEvent } from '@lukulent/svelte-umami';
	import mountains from '../assets/sisters_title.webp';
	import { getNavigate } from '../navigation';

	const navigate = getNavigate();

	function diveIn() {
		trackEvent('dive-in');
		navigate('demogs');
	}
</script>

<main class="introPage titlePage">
	<div class="head">
		<h1>What did Central Oregonians have to say about AI?</h1>
	</div>
	<img class="mountains" src={mountains} alt="" width="1800" height="849" fetchpriority="high" />
	<div class="intro">
		<p>
			Central Oregon Civic Action Project (COCAP) and its partners talked to
			<span class="highlight">over 400 real Central Oregonians</span> from all over the region to hear
			what they thought should be done about AI.
		</p>
		<button class="diveIn" type="button" onclick={diveIn}>Dive In</button>
	</div>
</main>

<style>
	/* one centred stack at every width: headline, mountains, copy, button */
	.titlePage {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-bottom: 0;
		/* the mountains bleed past the column's edges on mobile */
		overflow-x: clip;
		color: var(--theme-blue);
		text-align: center;
	}
	.head {
		padding: 24px 22px 0;
	}
	h1 {
		font-family: var(--geom);
		font-weight: 700;
		font-size: clamp(36px, 10.5vw, 52px);
		line-height: 1.05;
		letter-spacing: -0.02em;
		margin: 10px auto 0;
		max-width: 13em;
	}
	.mountains {
		display: block;
		flex: none;
		width: 100%;
		height: auto;
		aspect-ratio: 1800 / 849;
		margin: 24px auto 0;
	}
	.intro {
		padding: 34px 22px 24px;
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
		}
	}
	@media (min-width: 660px) {
		.mountains {
			width: min(68%, 620px);
		}
		.intro p {
			font-size: 19px;
			margin-bottom: 22px;
			max-width: 34em;
		}
		.diveIn {
			font-size: 22px;
			padding: 21px 26px;
		}
	}
</style>
