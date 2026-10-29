<script module lang="ts">
	import { ArrowRight, Check } from '@lucide/svelte';
	import { LEVEL_STYLE } from './levels';
	import type { Place, PlaceLevel } from './places';

	const CHILD_NOUN: Record<PlaceLevel, string> = {
		state: 'counties',
		county: 'cities and towns',
		city: ''
	};

	/** What a place contains, for the line under its name: "36 counties", "1 city or town". */
	export function childSummary(place: Place): string {
		const count = place.childCount;
		if (place.level === 'state') return count === 1 ? '1 county' : `${count} counties`;
		if (place.level === 'county') {
			if (count === 0) return 'No cities listed';
			return count === 1 ? '1 city or town' : `${count} cities and towns`;
		}
		return '';
	}
</script>

<script lang="ts">
	import { cn } from '@civicos/shared/utils';
	import type { PlaceSelectorState } from './place-selector.svelte';

	type Props = {
		place: Place;
		selector: PlaceSelectorState;
		/**
		 * `drill` rows sit in a drilldown pane and say what they contain, or which
		 * selected ancestor includes them. `search` rows show where the place is.
		 */
		variant: 'drill' | 'search';
		ondrill: (place: Place) => void;
		onhover?: (id: string | null) => void;
	};

	let { place, selector, variant, ondrill, onhover }: Props = $props();

	const style = $derived(LEVEL_STYLE[place.level]);
	const selected = $derived(selector.isSelected(place.id));
	const coveredBy = $derived(selected ? null : selector.coveredBy(place.id));
	const canDrill = $derived(place.level !== 'city' && place.childCount > 0);
	const subLine = $derived.by(() => {
		if (variant === 'search') return place.context;
		if (coveredBy) return `Included with ${coveredBy.name}`;
		return childSummary(place);
	});
	const Icon = $derived(style.icon);
	const checkStyle = $derived.by(() => {
		if (selected) return cn(style.selectedCheck, 'text-card');
		if (coveredBy) return 'border-input bg-muted text-muted-foreground';
		return 'border-input text-transparent group-hover:border-muted-foreground';
	});
</script>

<li class="flex min-h-14 items-stretch border-b border-border">
	<button
		type="button"
		class={cn(
			'group flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
			selected && style.selectedRow
		)}
		aria-pressed={selected}
		aria-label="{place.name}, {place.level}"
		onclick={() => selector.toggle(place.id)}
		onpointerenter={() => onhover?.(place.id)}
		onfocus={() => onhover?.(place.id)}
	>
		<span class={cn('grid size-8 flex-none place-items-center rounded-lg', style.square)}>
			<Icon class="size-[18px]" aria-hidden="true" />
		</span>
		<span class="flex min-w-0 flex-1 flex-col">
			<span class="truncate text-body font-medium">{place.name}</span>
			{#if subLine}
				<!-- Muted grey drops under 4.5:1 on the level tint, so selected rows darken it. -->
				<span
					class={cn(
						'truncate text-caption text-muted-foreground',
						selected && 'text-foreground/80'
					)}
				>
					{subLine}
				</span>
			{/if}
		</span>
		<span
			class={cn(
				'grid size-[22px] flex-none place-items-center rounded-full border-[1.5px] transition-colors',
				checkStyle
			)}
		>
			<Check class="size-[13px]" strokeWidth={3} aria-hidden="true" />
		</span>
	</button>
	{#if canDrill}
		<button
			type="button"
			class="grid w-14 flex-none place-items-center border-l border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
			aria-label="Show {CHILD_NOUN[place.level]} in {place.name}"
			data-drill={place.id}
			onclick={() => ondrill(place)}
			onpointerenter={() => onhover?.(place.id)}
			onfocus={() => onhover?.(place.id)}
		>
			<ArrowRight class="size-5" aria-hidden="true" />
		</button>
	{:else if variant === 'search'}
		<span class="w-14 flex-none" aria-hidden="true"></span>
	{/if}
</li>
