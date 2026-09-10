<script lang="ts">
	import { navBarStateFor, stepFrom } from '../domain/nav';
	import { getNavigate } from '../navigation';

	/** `shown` is bindable so the column can reserve the bar's height in step with it */
	let { step, shown = $bindable(false) }: { step: string; shown?: boolean } = $props();

	const navigate = getNavigate();
	const bar = $derived(navBarStateFor(step));

	/**
	 * The reveal is delayed and plays once per hidden→shown transition, matching
	 * "slides in once, then stays" rather than re-animating on every step
	 * between bar pages.
	 */
	$effect(() => {
		if (!bar) {
			shown = false;
			return;
		}
		if (shown) return;
		const timer = setTimeout(() => (shown = true), 500);
		return () => clearTimeout(timer);
	});

	const go = (delta: number) => {
		const next = stepFrom(step, delta);
		if (next) navigate(next);
	};
</script>

<!--
	One shared bar for every counted step rather than markup duplicated per page.
	Its label, position and targets all come from domain/nav.ts; a step the bar
	does not count (the title page, or any single theme) hides it entirely.
-->
<nav class="pageBar" class:shown aria-hidden={!bar}>
	<div class="pageBarProgress">
		<div class="pageBarProgressFill" style="width:{bar?.progress ?? 0}%"></div>
	</div>
	<div class="pageBarName">
		<span class="pageBarStep">{bar ? `${bar.step}/${bar.total}` : ''}</span>
		<span class="pageBarLabel">{bar?.label ?? ''}</span>
	</div>
	<div class="pageBarNav">
		<button class="pageBarBack" type="button" aria-label="Back" onclick={() => go(-1)}>
			<svg viewBox="0 0 26 14" aria-hidden="true"
				><path
					d="M25 7H1.6M7.4 1.4L1.2 7l6.2 5.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			>
		</button>
		<button
			class="pageBarNext"
			type="button"
			aria-label="Next"
			disabled={bar?.atEnd}
			onclick={() => go(1)}
		>
			<svg viewBox="0 0 26 14" aria-hidden="true"
				><path
					d="M1 7h23.4M18.6 1.4L24.8 7l-6.2 5.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			>
		</button>
	</div>
</nav>

<style>
	/* Column-width-matched to .shell rather than full-viewport, so it reads as
	   part of the same one-column layout on wide viewports. Hidden state is
	   off-screen via transform, not display:none, so both the entrance
	   (delayed, see above) and the exit (immediate) can transition. */
	.pageBar {
		position: fixed;
		bottom: 0;
		left: 50%;
		z-index: 50;
		width: 100%;
		max-width: 600px;
		height: var(--bar-h);
		transform: translate(-50%, 100%);
		transition: transform 0.35s cubic-bezier(0.2, 0.85, 0.3, 1);
		background: var(--bar-blue);
		display: flex;
		align-items: stretch;
		padding-left: 18px;
		/* overflow clips the flush-right buttons into the rounded corner */
		border-radius: 16px 16px 0 0;
		overflow: hidden;
	}
	.pageBar.shown {
		transform: translate(-50%, 0);
	}
	.pageBar button:focus-visible {
		outline-offset: -4px;
	}
	@media (min-width: 660px) {
		.pageBar {
			max-width: 800px;
		}
	}
	/* track (faint, full width) + fill (solid, X/Y of the way across); the
	   track alone reads as a subtle top divider even at step 1 */
	.pageBarProgress {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(255, 255, 255, 0.2);
	}
	.pageBarProgressFill {
		height: 100%;
		width: 0;
		background: #fff;
		transition: width 0.3s ease;
	}
	.pageBarName {
		flex: 1;
		min-width: 0;
		align-self: center;
		font-family: var(--geom);
		font-weight: 600;
		color: #fff;
		font-size: 19px;
		letter-spacing: -0.01em;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.pageBarStep {
		opacity: 0.6;
		flex: none;
	}
	.pageBarLabel {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pageBarNav {
		flex: none;
		display: flex;
		align-items: stretch;
	}
	.pageBarBack,
	.pageBarNext {
		width: var(--bar-h);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		transition: background 0.2s ease;
	}
	.pageBarBack {
		background: rgba(255, 255, 255, 0.12);
	}
	.pageBarNext {
		background: var(--bar-pink);
	}
	.pageBarNext[disabled] {
		opacity: 0.35;
		pointer-events: none;
	}
	.pageBarBack svg,
	.pageBarNext svg {
		stroke: currentColor;
		stroke-width: 2.6;
		fill: none;
	}
	.pageBarBack svg {
		width: 25px;
		height: 14px;
	}
	.pageBarNext svg {
		width: 23px;
		height: 13px;
	}
	@media (hover: hover) {
		.pageBarBack:hover {
			background: rgba(255, 255, 255, 0.24);
		}
		.pageBarNext:hover {
			background: color-mix(in srgb, var(--bar-pink) 82%, #000);
		}
	}
	@media (min-width: 660px) {
		.pageBarName {
			font-size: 24px;
		}
		.pageBarBack svg {
			width: 29px;
			height: 16px;
		}
		.pageBarNext svg {
			width: 27px;
			height: 15px;
		}
	}
</style>
