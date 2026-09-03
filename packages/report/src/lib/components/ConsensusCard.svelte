<script lang="ts">
	import { GROUPS } from '../domain/bundled';
	import { groupsOf } from '../domain/data';
	import { nudgeApart } from '../domain/layout';
	import { demoLineFor, emojiFor, titleCaseChip } from '../domain/copy';
	import type { ReportRecord } from '../domain/types';
	import { selection } from '../state.svelte';
	import VerdictPill from './VerdictPill.svelte';

	interface Props {
		record: ReportRecord;
		onopen: () => void;
	}

	let { record, onopen }: Props = $props();

	const groups = $derived(record.vote ? groupsOf(GROUPS, record.vote) : []);

	const demoText = $derived.by(() => {
		if (record.origin === 'cocap_seed') return demoLineFor(record);
		const chips = record.chips.filter((c) => c.toLowerCase() !== 'not provided');
		return chips.length ? chips.map(titleCaseChip).join(', ') : 'Anonymous';
	});

	// $state, not plain lets: the effects below read these, and a bind:this
	// assignment has to be what re-runs them rather than relying on the order
	// Svelte happens to assign refs and flush effects in.
	let track = $state<HTMLDivElement>();
	let demoWrap = $state<HTMLDivElement>();
	let demoTrack = $state<HTMLSpanElement>();

	const reduced = $derived(
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	let placed = $state<number[]>([]);
	let line = $state({ left: 0, width: 0 });
	let marquee = $state(false);

	/**
	 * The squares are placed in pixels, so this has to run against real laid-out
	 * geometry rather than at render time: --sq and the track's width are both
	 * read back off the DOM. nudgeApart then stops two groups with close
	 * percentages from sitting on top of each other.
	 */
	function layoutBar() {
		if (!track || !groups.length) return;
		const sq = parseFloat(getComputedStyle(track).getPropertyValue('--sq')) || 26;
		const half = sq / 2;
		const width = track.clientWidth;
		const xFor = (pct: number) =>
			half + ((width - half * 2) * Math.max(0, Math.min(100, pct))) / 100;
		const xs = groups.map((g) => xFor(g.pct ?? 0));
		placed = nudgeApart(xs, sq + 2, half, width - half);
		line = { left: Math.min(...xs), width: Math.max(...xs) - Math.min(...xs) };
	}

	$effect(() => {
		layoutBar();
		if (!track) return;
		const observer = new ResizeObserver(layoutBar);
		observer.observe(track);
		return () => observer.disconnect();
	});

	// The chip row scrolls sideways only when it actually overflows; duplicating
	// the text is what makes the loop seamless.
	$effect(() => {
		if (reduced || !demoTrack || !demoWrap) return;
		marquee = demoTrack.scrollWidth > demoWrap.clientWidth;
		if (!marquee) return;
		const single = demoTrack.firstElementChild?.getBoundingClientRect().width ?? 0;
		const gap = parseFloat(getComputedStyle(demoTrack).columnGap) || 0;
		const distance = single + gap;
		demoTrack.style.setProperty('--marquee-dist', `-${distance}px`);
		demoTrack.style.setProperty('--marquee-dur', `${Math.max(4, distance / 34)}s`);
	});
</script>

<button
	class="lcard"
	class:sel={selection.recordId === record.id}
	data-rid={record.id}
	onclick={onopen}
>
	<div class="lWho">
		<span class="lEmoji">{emojiFor(record)}</span>
		<div class="lDemoWrap" bind:this={demoWrap}>
			<span class="lDemoTrack" class:marquee bind:this={demoTrack}>
				<span>{demoText}</span>
				{#if marquee}<span aria-hidden="true">{demoText}</span>{/if}
			</span>
		</div>
	</div>

	<p class="lText">“{record.text}”</p>

	{#if record.vote}
		<div class="lBarLabels">
			<span>&lt;- Disagree (0%)</span>
			<VerdictPill vote={record.vote} />
			<span>Agree (100%) -&gt;</span>
		</div>
		<div class="lBar">
			<div class="lBarTrack" class:tight={GROUPS.length > 3} bind:this={track}>
				<span class="lBarEdge lo">0%</span>
				<span class="lBarEdge hi">100%</span>
				<div class="lBarMid"></div>
				<div class="lBarLine" style="left:{line.left}px;width:{line.width}px"></div>
				{#each groups as group, i (group.key)}
					<div class="lBarSq" style="left:{placed[i] ?? 0}px">{group.key}</div>
				{/each}
			</div>
		</div>
	{/if}
</button>

<style>
	.lcard {
		display: block;
		width: 100%;
		text-align: left;
		background: #fff;
		border-radius: 20px;
		padding: 16px 18px 0;
		overflow: hidden; /* so the bottom viz's bleed can meet the card's own rounded corners */
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}
	@media (hover: hover) {
		.lcard:hover {
			transform: translateY(-2px);
			box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
		}
	}
	.lcard.sel {
		box-shadow:
			0 0 0 3px var(--c),
			0 10px 30px rgba(0, 0, 0, 0.28);
	}

	/* eyebrow, the participant's emoji plus their demographic chips,
	   marqueeing sideways when the text is too long for the card */
	.lWho {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 9px;
		color: color-mix(in srgb, var(--c) 62%, #000);
	}
	.lWho .lEmoji {
		flex: none;
		font-size: 15px;
		line-height: 1;
	}
	.lWho .lDemoWrap {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}
	.lWho .lDemoTrack {
		display: inline-flex;
		gap: 2.4em;
		white-space: nowrap;
		font-family: var(--mono);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.lWho .lDemoTrack.marquee {
		animation: lDemoScroll var(--marquee-dur, 10s) linear infinite;
	}
	@keyframes lDemoScroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(var(--marquee-dist, -50%));
		}
	}

	.lText {
		margin: 0 0 16px;
		color: var(--ink);
		font-family: var(--geom);
		font-weight: 600;
		font-size: 23px;
		line-height: 1.32;
		letter-spacing: -0.012em;
	}

	/* bottom viz, where each group's agreement % lands on a disagree-to-
	   agree track. Labels sit in the card's normal (uncolored) flow; only
	   the track itself is tinted and bled flush to the card's edges (and
	   its bottom corners). */
	.lBarLabels {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 10px;
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(0, 0, 0, 0.8);
		margin-bottom: 8px;
	}
	.lBarLabels :global(.who) {
		flex: none;
	}
	.lBar {
		margin: 0 -18px;
		padding: 10px 18px 14px;
		background: color-mix(in srgb, var(--c) 13%, transparent);
	}
	/* --sq is the group square's size, and the JS reads it back to compute the
	   track's usable width, change it here, not there. Polis can return more
	   clusters than the two this started with, so past three the squares shrink
	   to keep them all on the track. */
	.lBarTrack {
		position: relative;
		--sq: 26px;
		height: var(--sq);
	}
	.lBarTrack.tight {
		--sq: 20px;
	}
	/* 0%/100% end labels, centered on the same half-square inset the group
	   squares use at their own extremes (HALF_SQ in the JS), so a square sitting
	   right on 0% or 100% lands directly on top of its label */
	.lBarEdge {
		position: absolute;
		top: 50%;
		font-family: var(--geom);
		font-weight: 700;
		font-size: 14px;
		color: var(--c);
		opacity: 0.65;
	}
	.lBarEdge.lo {
		left: calc(var(--sq) / 2);
		transform: translate(-50%, -50%);
	}
	.lBarEdge.hi {
		right: calc(var(--sq) / 2);
		transform: translate(50%, -50%);
	}
	.lBarMid {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: rgba(0, 0, 0, 0.18);
		transform: translateX(-50%);
	}
	.lBarLine {
		position: absolute;
		top: 50%;
		height: 2.5px;
		background: var(--c);
		transform: translateY(-50%);
	}
	.lBarSq {
		position: absolute;
		top: 50%;
		width: var(--sq);
		height: var(--sq);
		transform: translate(-50%, -50%);
		background: var(--c);
		border-radius: 6px;
		display: grid;
		place-items: center;
		font-family: var(--geom);
		font-weight: 700;
		font-size: 11px;
		color: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
	}
</style>
