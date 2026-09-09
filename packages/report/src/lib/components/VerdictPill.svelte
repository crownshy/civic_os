<script lang="ts">
	import consensusIcon from '../assets/consensus.svg';
	import differenceIcon from '../assets/difference.svg';
	import type { Vote } from '../domain/types';
	import { verdictFor } from '../domain/verdict';

	// the domain names an icon; the asset URL is a rendering concern
	const ICONS = { consensus: consensusIcon, difference: differenceIcon };

	let { vote }: { vote: Vote } = $props();

	const verdict = $derived(verdictFor(vote));
</script>

<!--
	.who and its state modifiers are still global in app.css: the statement
	modal renders the same badge and has not been converted yet.
-->
<div class="who {verdict.kind}">
	<span class="av">
		{#if verdict.icon}<img src={ICONS[verdict.icon]} alt="" />{/if}
	</span>
	<span class="txt">{verdict.label}</span>
</div>

<style>
	/* consensus / difference / plain-agreement indicator for poll statements
	   (quotes have no vote data, so the pill is hidden entirely for those) */
	.who {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: #fff;
		border-radius: 999px;
		padding: 5px 13px 5px 5px;
		min-height: 30px;
		max-width: 82%;
	}
	.who.consensus,
	.who.consensus-against {
		background: var(--agree);
	}
	.who.difference {
		background: var(--disagree);
	}
	.who.neutral {
		background: #484848;
	}
	.who .av {
		width: 21px;
		height: 21px;
		border-radius: 50%;
		background: #fff;
		flex: none;
		display: grid;
		place-items: center;
	}
	.who .av img {
		width: 14px;
		height: 14px;
		object-fit: contain;
		display: block;
	}
	.who .txt {
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
