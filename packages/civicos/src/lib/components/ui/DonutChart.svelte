<script lang="ts">
	import { pie, arc, type PieArcDatum } from 'd3-shape';

	interface ChartData {
		label: string;
		count: number;
		color: string;
	}

	interface Props {
		data: ChartData[];
		size?: number;
		innerRadius?: number;
		showLegend?: boolean;
	}

	let { data, size = 200, innerRadius = 0.65, showLegend = true }: Props = $props();

	let hoveredSlice = $state<ChartData | null>(null);
	const pieData = $derived(
		pie<ChartData>()
			.value((d) => d.count)
			.sort(null)(data)
	);

	const total = $derived(data.reduce((sum, d) => sum + d.count, 0));

	const arcGenerator = $derived(
		arc<PieArcDatum<ChartData>>()
			.innerRadius((size / 2) * innerRadius)
			.outerRadius(size / 2 - 2)
	);

	// Convert color class to CSS variable for SVG
	function getColorFromClass(colorClass: string): string {
		const colorMap: Record<string, string> = {
			'bg-chart-1': 'var(--chart-1)',
			'bg-chart-2': 'var(--chart-2)',
			'bg-chart-3': 'var(--chart-3)',
			'bg-chart-4': 'var(--chart-4)',
			'bg-chart-5': 'var(--chart-5)',
			'bg-chart-6': 'var(--chart-6)',
			'bg-chart-undefined': 'var(--chart-undefined)'
		};
		return colorMap[colorClass] || 'var(--chart-1)';
	}

	function handleMouseEnter(sliceData: ChartData) {
		hoveredSlice = sliceData;
	}

	function handleMouseLeave() {
		hoveredSlice = null;
	}
</script>

<div class="flex flex-col items-center gap-6">
	<div class="relative" style="width: {size}px; height: {size}px;">
		<svg width={size} height={size}>
			<g transform="translate({size / 2}, {size / 2})">
				{#each pieData as slice, i (i)}
					<path
						d={arcGenerator(slice) || ''}
						fill={getColorFromClass(slice.data.color)}
						stroke="var(--background)"
						stroke-width="2"
						class="cursor-pointer transition-opacity duration-200"
						style="opacity: {hoveredSlice && hoveredSlice.label !== slice.data.label ? 0.5 : 1}"
						role="button"
						tabindex="0"
						aria-label="{slice.data.label}: {slice.data.count} participants"
						onmouseenter={() => handleMouseEnter(slice.data)}
						onmouseleave={handleMouseLeave}
					/>
				{/each}
			</g>
		</svg>

		<!-- Center label -->
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center"
		>
			{#if hoveredSlice}
				<div class="font-mono text-2xl font-medium text-foreground">
					{hoveredSlice.count >= 1000
						? `${(hoveredSlice.count / 1000).toFixed(1)}K`
						: hoveredSlice.count}
				</div>
				<div class="font-mono text-[10px] font-medium text-foreground uppercase">
					{hoveredSlice.label}
				</div>
			{:else}
				<div class="font-mono text-2xl font-medium text-foreground">
					{total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
				</div>
				<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>
			{/if}
		</div>
	</div>

	{#if showLegend}
		<div class="grid w-full grid-cols-2 gap-3">
			{#each data as item, i (`${item.label}-${i}`)}
				<div class="flex items-center gap-3.5">
					<div
						class="h-3 w-3 shrink-0 rounded-full"
						style="background-color: {getColorFromClass(item.color)}"
					></div>
					<span class="font-sans text-sm font-medium text-foreground">{item.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
