<script lang="ts">
	import { getOpenDemographics } from '../navigation';
	import CountyMap from './CountyMap.svelte';

	const openDemographics = getOpenDemographics();

	let map = $state<ReturnType<typeof CountyMap>>();
</script>

<main class="introPage demogsPage">
	<div class="masthead">
		<div class="eyebrow label">Central Oregon &amp; AI</div>
	</div>

	<CountyMap bind:this={map} />

	<button
		class="introNext demogReset"
		type="button"
		aria-label="Reset map view"
		onclick={() => map?.reset()}
	>
		<svg viewBox="0 0 22 22" aria-hidden="true"
			><path
				d="M11 4v4M11 4a7 7 0 1 1-6.1 3.6M4.9 4.6V8h3.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
	</button>

	<div class="demogStat">
		<h1>400+</h1>
		<p>People across the region participated in this conversation, both online and in person.</p>
		<button class="demogLink" type="button" onclick={openDemographics}
			>See full demographics…</button
		>
	</div>
</main>

<style>
	.demogsPage {
		background: var(--home);
		color: #fff;
	}
	/* .demogMap going position:absolute promotes it into the "positioned"
	   paint bucket ahead of these still-static siblings by default; without
	   an explicit stack here they'd paint (and sit) underneath the map instead
	   of over it as the intended overlay. Scoped to the page since .masthead
	   is shared across every L0 page. */
	.demogsPage .masthead,
	.demogsPage .demogStat {
		position: relative;
		z-index: 2;
	}
	.demogsPage .introNext {
		z-index: 2;
	}
	/* the map runs to the very top of the page with no scrim, so the eyebrow
	   needs a solid band behind it to stay legible */
	.demogsPage .masthead {
		background: var(--home);
	}
	/* the reset button borrows .introNext's whole visual shell (circle, shadow,
	   hover transition) via a second class on the same element; the arrow's
	   own bottom-right slot is already taken by page navigation, so this sits
	   at bottom-left instead, both thumb-reachable on mobile. Compound selector
	   (not a same-specificity bare .demogReset) so this reliably beats the base
	   .introNext rule regardless of declaration order. */
	.introNext.demogReset {
		left: 22px;
		right: auto;
		bottom: 26px;
	}
	/* the headline stat sits below the map rather than inside .masthead;
	   the mock centers this block, unlike Title's left-aligned copy. Its own
	   gradient (solid --home fading to transparent going down) grounds the
	   text against the map underneath it. */
	.demogStat {
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
	@media (min-width: 660px) {
		.demogStat p {
			font-size: 20px;
		}
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
	/* the "continue to the next intro page" bubble, same position/style on
	   every intro page. Only the map reset uses it now. */
	.introNext {
		position: absolute;
		right: 22px;
		bottom: 26px;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #fff;
		color: var(--home);
		display: grid;
		place-items: center;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
		transition: transform 0.2s ease;
	}
	@media (hover: hover) {
		.introNext:hover {
			transform: scale(1.07);
		}
	}
	.introNext svg {
		width: 22px;
		height: 12px;
		stroke: currentColor;
		stroke-width: 2;
		fill: none;
	}
</style>
