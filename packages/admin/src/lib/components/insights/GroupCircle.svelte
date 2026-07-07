<script lang="ts">
	/**
	 * Compact agree% visualization for one group on a single statement (Insights
	 * "Option 1"). A colored arc whose length is the group's agree% and whose
	 * color grades the extent of agreement — red < 33%, yellow 33–66%, green 66%+.
	 * The non-agree remainder shows as the gray track. Hovering reveals the full
	 * vote breakdown (agree/disagree/pass) for that group + statement.
	 */
	interface Props {
		/** Group letter (A, B, …). Shown in the tooltip header and optional label. */
		label?: string;
		/**
		 * Agree% driving the arc length + center number, 0–100. This is the value
		 * already reflecting the section's include/exclude-passes toggle, so the arc
		 * matches the "Agree %" column.
		 */
		agreePct: number;
		/** Raw vote counts — power the tooltip's honest full breakdown (always incl. passes) and N. */
		agrees: number;
		disagrees: number;
		passes: number;
		size?: 'sm' | 'md';
		/** Show the group label beneath the ring. Off in dense statement rows. */
		showLabel?: boolean;
	}

	let {
		label = '',
		agreePct,
		agrees,
		disagrees,
		passes,
		size = 'sm',
		showLabel = true
	}: Props = $props();

	const clamped = $derived(Math.min(100, Math.max(0, agreePct)));

	// Extent-of-agreement color buckets (ticket): red < 33%, yellow 33–66%, green 66%+.
	const arcStroke = $derived(
		clamped < 33 ? 'stroke-meter-under' : clamped <= 66 ? 'stroke-meter-near' : 'stroke-meter-met'
	);

	// SVG geometry. viewBox is 40×40; the ring sits inside the stroke so r leaves
	// half the stroke width on each side. Rotated -90° so the arc starts at 12
	// o'clock and grows clockwise.
	const R = 17.5;
	const CIRC = 2 * Math.PI * R;
	const dash = $derived((clamped / 100) * CIRC);

	const ringSize = $derived(size === 'md' ? 'size-11' : 'size-10');

	// Tooltip: the TRUE full breakdown over all votes cast (incl. passes), so the
	// three rows always sum to ~100% regardless of the exclude-passes toggle.
	const total = $derived(agrees + disagrees + passes);
	const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
</script>

<div class="group/circle relative flex flex-col items-center gap-0.5">
	<div class={`relative ${ringSize}`}>
		<svg class="size-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
			<circle class="stroke-ring-track" cx="20" cy="20" r={R} fill="none" stroke-width="5" />
			<circle
				class={arcStroke}
				cx="20"
				cy="20"
				r={R}
				fill="none"
				stroke-width="5"
				stroke-linecap="round"
				stroke-dasharray={`${dash} ${CIRC - dash}`}
			/>
		</svg>
		<span
			class="font-ui text-foreground text-caption absolute inset-0 flex items-center justify-center font-bold leading-none"
		>
			{Math.round(clamped)}
		</span>
	</div>

	{#if showLabel && label}
		<span class="text-muted-foreground text-caption font-semibold uppercase">{label}</span>
	{/if}

	<!-- Vote-breakdown tooltip. Positioned above the ring; escapes the card because
	     the section Card renders overflow-visible. -->
	<div
		role="tooltip"
		class="bg-slate-900 pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded-xl px-3.5 py-3 opacity-0 shadow-lg transition-opacity duration-150 group-hover/circle:opacity-100"
	>
		<div class="text-caption font-bold uppercase text-white">
			Group {label} <span class="text-white/60">(N={total})</span>
		</div>
		<dl class="mt-2 space-y-1 text-white/80">
			<div class="text-caption flex items-center justify-between font-semibold">
				<dt>Agree</dt>
				<dd class="tabular-nums">{pct(agrees)}%</dd>
			</div>
			<div class="text-caption flex items-center justify-between font-semibold">
				<dt>Disagree</dt>
				<dd class="tabular-nums">{pct(disagrees)}%</dd>
			</div>
			<div class="text-caption flex items-center justify-between font-semibold">
				<dt>Pass</dt>
				<dd class="tabular-nums">{pct(passes)}%</dd>
			</div>
		</dl>
	</div>
</div>
