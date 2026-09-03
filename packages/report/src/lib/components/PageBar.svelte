<script lang="ts">
	import { navBarStateFor, stepFrom } from '../domain/nav';
	import { getNavigate } from '../navigation';

	let { step }: { step: string } = $props();

	const navigate = getNavigate();
	const bar = $derived(navBarStateFor(step));

	/**
	 * The reveal is delayed and plays once per hidden→shown transition, matching
	 * "slides in once, then stays" rather than re-animating on every step
	 * between bar pages.
	 */
	let shown = $state(false);

	$effect(() => {
		if (!bar) {
			shown = false;
			document.body.classList.remove('navBarOn');
			return;
		}
		if (shown) return;
		const timer = setTimeout(() => {
			shown = true;
			document.body.classList.add('navBarOn');
		}, 500);
		return () => clearTimeout(timer);
	});

	$effect(() => () => document.body.classList.remove('navBarOn'));

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
		<button class="pageBarNext" type="button" disabled={bar?.atEnd} onclick={() => go(1)}>
			NEXT
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
	/* ─────────────────────────────────────────────
	   TOP PAGE BAR, shared across demogs/groups/consensus/themes (see
	   domain/nav.ts). Column-width-matched to .shell
	   rather than full-viewport, so it reads as part of the same one-column
	   layout on wide viewports instead of a separate full-bleed strip.
	   Hidden state is off-screen via transform, not display:none, so both the
	   entrance (delayed, see JS) and the exit (immediate) can transition;
	   .shown is the only thing toggling it either direction. ───────────────*/
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
		align-items: center;
		justify-content: space-between;
		padding: 0 18px;
	}
	.pageBar.shown {
		transform: translate(-50%, 0);
	}
	@media (min-width: 660px) {
		.pageBar {
			max-width: 800px;
		}
	}
	/* track (faint, full width) + fill (solid, X/Y of the way across); the
	   track alone reads as a subtle top divider even at step 1, same job the
	   plain border it replaced was doing */
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
		font-family: var(--geom);
		font-weight: 600;
		color: #fff;
		font-size: 17px;
		letter-spacing: -0.01em;
		display: flex;
		align-items: baseline;
		gap: 8px;
		min-width: 0;
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
		align-items: center;
		gap: 10px;
	}
	.pageBarBack {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
		display: grid;
		place-items: center;
		transition: background 0.2s ease;
	}
	@media (hover: hover) {
		.pageBarBack:hover {
			background: rgba(255, 255, 255, 0.26);
		}
	}
	.pageBarBack svg {
		width: 16px;
		height: 9px;
		stroke: currentColor;
		stroke-width: 2;
		fill: none;
	}
	.pageBarNext {
		display: flex;
		align-items: center;
		gap: 7px;
		background: var(--bar-pink);
		color: #fff;
		padding: 10px 18px;
		border-radius: 999px;
		font-family: var(--mono);
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		transition: opacity 0.2s ease;
	}
	.pageBarNext[disabled] {
		opacity: 0.35;
		pointer-events: none;
	}
	.pageBarNext svg {
		width: 15px;
		height: 9px;
		stroke: currentColor;
		stroke-width: 2;
		fill: none;
	}
	@media (min-width: 660px) {
		.pageBarName {
			font-size: 22px;
		}
		.pageBarNext {
			font-size: 13px;
			padding: 12px 22px;
		}
	}
</style>
