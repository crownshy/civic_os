<script lang="ts">
	import { lowDataTip } from '../domain/copy';

	interface Props {
		/** how many votes the flagged readout rests on */
		votes: number;
		/**
		 * Inside a statement card, which is itself a button, the flag cannot be
		 * focusable; there the tip shows on hover and is read as part of the
		 * card's own name.
		 */
		focusable?: boolean;
	}

	let { votes, focusable = false }: Props = $props();

	const tip = $derived(lowDataTip(votes));
</script>

{#if focusable}
	<button class="lowFlag" type="button"
		><span aria-hidden="true">⚠️</span><span class="tip">{tip}</span></button
	>
{:else}
	<span class="lowFlag"><span aria-hidden="true">⚠️</span><span class="tip">{tip}</span></span>
{/if}

<style>
	.lowFlag {
		position: relative;
		display: inline-flex;
		font-size: 12px;
		font-weight: 400;
		line-height: 1;
		letter-spacing: 0;
		cursor: default;
	}
	/* hidden by opacity, not display, so it stays in the accessible name */
	.tip {
		position: absolute;
		bottom: calc(100% + 7px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
		background: var(--home);
		color: #fff;
		font-family: var(--mono);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: none;
		white-space: nowrap;
		padding: 5px 9px;
		border-radius: 6px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease;
	}
	.lowFlag:hover .tip,
	.lowFlag:focus-visible .tip {
		opacity: 1;
	}
</style>
