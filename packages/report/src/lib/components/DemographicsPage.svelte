<script lang="ts">
	import { getOpenDemographics } from '../navigation';
	import CountyMap from './CountyMap.svelte';

	const openDemographics = getOpenDemographics();

	let statHeight = $state(0);
</script>

<main class="introPage demogsPage">
	<CountyMap {statHeight} />

	<div class="demogStat" bind:offsetHeight={statHeight}>
		<h1>400+</h1>
		<p>
			People across the region participated in this conversation, both through our Open Poll and
			live conversations.
		</p>
		<button class="demogLink" type="button" onclick={openDemographics}
			>See full demographics…</button
		>
	</div>
</main>

<style>
	/* the page never scrolls: it is exactly the viewport below the top bar,
	   and dragging pans the map instead */
	.demogsPage {
		height: calc(100vh - var(--topbar-h));
		height: calc(100dvh - var(--topbar-h));
		min-height: 0;
		padding-bottom: 0;
		overflow: hidden;
		color: #fff;
	}
	/* the map is positioned, which would otherwise paint it over this block;
	   the gradient grounds the text against the map underneath it */
	.demogStat {
		position: relative;
		z-index: 2;
		padding: 35px 22px 24px;
		text-align: center;
		background: linear-gradient(180deg, var(--home) 0%, transparent 100%);
	}
	.demogStat h1 {
		font-family: var(--geom);
		font-weight: 700;
		margin: 0;
		font-size: clamp(64px, 20vw, 110px);
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.demogStat p {
		font-size: 18px;
		line-height: 1.5;
		margin: 8px auto 0;
		max-width: 26em;
	}
	.demogLink {
		display: inline-block;
		margin-top: 16px;
		background: #fff;
		color: var(--home);
		padding: 12px 24px;
		border-radius: 999px;
		font-family: var(--geom);
		font-weight: 600;
		font-size: 16.5px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
		transition: transform 0.15s ease;
	}
	.demogLink:active {
		transform: scale(0.96);
	}
	@media (hover: hover) {
		.demogLink:hover {
			transform: scale(1.04);
		}
	}
	/* squeezed tight on mobile so the map gets the room */
	@media (max-width: 659px) {
		.demogStat {
			padding: 12px 22px 14px;
		}
		.demogStat p {
			line-height: 1.3;
			margin-top: 3px;
		}
		.demogLink {
			margin-top: 9px;
		}
	}
	@media (min-width: 660px) {
		.demogStat p {
			font-size: 20px;
		}
	}
</style>
