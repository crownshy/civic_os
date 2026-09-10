<script lang="ts">
	import consensusIcon from '../assets/consensus.svg';
	import differenceIcon from '../assets/difference.svg';
	import type { Vote } from '../domain/types';
	import { verdictFor } from '../domain/verdict';

	// the domain names an icon; the asset URL is a rendering concern
	const ICONS = { consensus: consensusIcon, difference: differenceIcon };

	interface Props {
		vote: Vote;
		/** on a card the pill spans the card with its label centred and no icon */
		variant: 'card' | 'header';
	}

	let { vote, variant }: Props = $props();

	const verdict = $derived(verdictFor(vote));
</script>

<!-- wide/large, not the variant's own name: a bare `card` class would pick up
     the modal's global .card rule -->
<div class="who {verdict.kind}" class:wide={variant === 'card'} class:large={variant === 'header'}>
	{#if variant === 'header'}
		<span class="av">
			{#if verdict.icon}<img src={ICONS[verdict.icon]} alt="" />{/if}
		</span>
	{/if}
	<span class="txt">{verdict.label}</span>
</div>

<style>
	/* consensus / difference / plain-agreement indicator for poll statements
	   (quotes have no vote data, so the pill is hidden entirely for those) */
	.who {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		color: #fff;
		border-radius: 999px;
		padding: 5px 15px 5px 5px;
		min-height: 34px;
		max-width: 82%;
	}
	.who.wide {
		display: flex;
		width: 100%;
		max-width: none;
		justify-content: center;
		padding-inline: 14px;
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
	.av {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #fff;
		flex: none;
		display: grid;
		place-items: center;
	}
	.av img {
		width: 16px;
		height: 16px;
		object-fit: contain;
		display: block;
	}
	.txt {
		font-family: var(--mono);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.who.large .txt {
		font-size: 13px;
	}
	@media (min-width: 660px) {
		.who {
			gap: 10px;
			padding-block: 6px;
			padding-left: 6px;
			min-height: 38px;
		}
		.who.large {
			padding-right: 17px;
		}
		.av {
			width: 27px;
			height: 27px;
		}
		.av img {
			width: 18px;
			height: 18px;
		}
		.txt {
			font-size: 13px;
		}
		.who.large .txt {
			font-size: 15px;
		}
	}
</style>
