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

	// Convert color class to hex for SVG
	function getColorFromClass(colorClass: string): string {
		const colorMap: Record<string, string> = {
			'bg-chart-1': 'hsl(var(--chart-1))',
			'bg-chart-2': 'hsl(var(--chart-2))',
			'bg-chart-3': 'hsl(var(--chart-3))',
			'bg-chart-4': 'hsl(var(--chart-4))',
			'bg-chart-5': 'hsl(var(--chart-5))',
			'bg-chart-6': 'hsl(var(--chart-6))'
		};
		return colorMap[colorClass] || 'hsl(var(--chart-1))';
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
						stroke="hsl(var(--background))"
						stroke-width="2"
					/>
				{/each}
			</g>
		</svg>

		<!-- Center label -->
		<div
			class="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center"
		>
			<div class="font-mono text-2xl font-medium text-foreground">
				{total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
			</div>
			<div class="font-mono text-[10px] font-medium text-foreground">PARTICIPANTS</div>
		</div>
	</div>

	{#if showLegend}
		<div class="grid w-full grid-cols-2 gap-3">
			{#each data as item (item.label)}
				<div class="flex items-center gap-3.5">
					<div class="h-3 w-3 shrink-0 rounded-full {item.color}"></div>
					<span class="font-sans text-sm font-medium text-foreground">{item.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
