<script lang="ts">
	import { geoMercator, geoPath, type ExtendedFeatureCollection } from 'd3-geo';
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
	import { onMount } from 'svelte';

	import { OREGON_COUNTIES, PARTICIPANT_LOCATIONS } from '../domain/bundled';
	import {
		DEMOG_MAX_ZOOM_IN,
		TRI_COUNTY_FIPS,
		dotRadius,
		homeFitCities,
		homeFitExtent,
		hoverBox,
		isMobileWidth,
		labelModeFor,
		labelPaintOrder,
		labelTextX,
		miniLabelX,
		minZoomScale,
		pillBox,
		type Box
	} from '../domain/map-layout';

	/** height of the stat block overlaid at the top, which the home view fits below */
	let { statHeight }: { statHeight: number } = $props();

	const cities = PARTICIPANT_LOCATIONS.cities;
	const maxCount = Math.max(...cities.map((c) => c.count));
	/** Radius never changes with zoom: markers keep a fixed screen size. */
	const radii = cities.map((city) => dotRadius(city.count, maxCount));
	const paintOrder = labelPaintOrder(cities);

	// the bundled GeoJSON is asserted, not validated, same boundary cast as
	// domain/bundled.ts makes for the rest of the data
	const counties = OREGON_COUNTIES as unknown as ExtendedFeatureCollection;

	const projection = geoMercator();
	const path = geoPath(projection);

	let frame = $state<HTMLDivElement>();
	let svg = $state<SVGSVGElement>();
	let size = $state({ width: 0, height: 0, barHeight: 0 });
	let transform = $state<ZoomTransform>(zoomIdentity);
	let hovered = $state<string | null>(null);

	const mobile = $derived(isMobileWidth(size.width));

	/**
	 * Fitting the projection is a mutation, so everything read off it is derived
	 * in the same pass: county paths, each city's projected point, and the
	 * bounds the zoom's limits come from.
	 */
	const fitted = $derived.by(() => {
		const { width, height, barHeight } = size;
		if (width <= 0 || height <= 0) return null;
		// d3-geo takes points as [lng, lat], the reverse of these field names' own
		// reading order (see participant-locations.json's _readme)
		const points: ExtendedFeatureCollection = {
			type: 'FeatureCollection',
			features: homeFitCities(cities, mobile).map((c) => ({
				type: 'Feature',
				properties: null,
				geometry: { type: 'Point', coordinates: [c.lng, c.lat] }
			}))
		};
		projection.fitExtent(homeFitExtent({ width, height, statHeight, barHeight }), points);
		return {
			counties: counties.features.map((f) => path(f) ?? ''),
			projected: cities.map(
				(c) => (projection([c.lng, c.lat] as [number, number]) ?? [0, 0]) as [number, number]
			),
			bounds: path.bounds(counties) as [[number, number], [number, number]]
		};
	});

	const modes = $derived(
		cities.map((city) => labelModeFor(transform.k, { mobile, major: Boolean(city.major) }))
	);

	const at = (i: number) => {
		const [x, y] = transform.apply(fitted!.projected[i]);
		return `translate(${x},${y})`;
	};

	// --- label + tooltip boxes, measured off the rendered text ----------------
	let labelText: SVGTextElement[] = $state([]);
	let hoverName: SVGTextElement[] = $state([]);
	let hoverCount: SVGTextElement[] = $state([]);
	let pills = $state<(Box & { rx: number })[]>([]);
	let tooltips = $state<(Box & { rx: number })[]>([]);

	// the web font swaps in after first paint, and text measured in the
	// fallback face would size every pill wrong
	let fontsLoaded = $state(false);
	onMount(() => {
		Promise.allSettled(
			['400 16px Geomanist', '600 16px Geomanist'].map((font) => document.fonts.load(font))
		).then(() => (fontsLoaded = true));
	});

	/**
	 * getBBox() reads the text's own rendered geometry, independent of the svg's
	 * viewBox or zoom transform, so this is safe before the projection has ever
	 * been fitted.
	 */
	$effect(() => {
		if (!fontsLoaded || labelText.length < cities.length || labelText.some((t) => !t)) return;
		pills = labelText.map((t, i) => pillBox(t.getBBox(), radii[i]));
		tooltips = hoverName.map((n, i) => hoverBox(n.getBBox(), hoverCount[i].getBBox()));
	});

	// --- pan/zoom -------------------------------------------------------------
	$effect(() => {
		const el = svg;
		const box = fitted;
		if (!el || !box) return;

		const z = zoom<SVGSVGElement, unknown>()
			.scaleExtent([minZoomScale(box.bounds, size.width, size.height), DEMOG_MAX_ZOOM_IN])
			.translateExtent(box.bounds)
			.extent([
				[0, 0],
				[size.width, size.height]
			])
			.on('zoom', (event) => (transform = event.transform));

		const sel = select<SVGSVGElement, unknown>(el);
		sel.call(z);
		sel.on('dblclick.zoom', null); // double-tap/dblclick-to-zoom wasn't asked for
		sel.call(z.transform, zoomIdentity); // a refit always returns to the home view

		return () => {
			sel.on('.zoom', null);
		};
	});

	$effect(() => {
		const el = frame;
		if (!el) return;
		let timer: ReturnType<typeof setTimeout>;
		// debounced so a drag-resize does not refit on every frame; it also fires
		// once when the page first becomes visible, which is what does the
		// initial fit
		const observer = new ResizeObserver(() => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				const rect = el.getBoundingClientRect();
				// the bar's own reveal is delayed, so its height comes from the token
				const barHeight =
					parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 70;
				size = { width: rect.width, height: rect.height, barHeight };
			}, 220);
		});
		observer.observe(el);
		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	});

	/** Only ever one city's tooltip at a time; null clears them all. */
	const show = (name: string | null) => (hovered = name);
</script>

<div class="demogMap" bind:this={frame}>
	<svg bind:this={svg} viewBox="0 0 {size.width} {size.height}" aria-hidden="true">
		<!-- click target for dismissing a tooltip -->
		<rect class="demogBg" onclick={() => show(null)} role="presentation" />

		<g class="demogWorld" transform={transform.toString()}>
			{#if fitted}
				{#each counties.features as feature, i (feature.id)}
					<path
						class="demogCounty"
						class:inRegion={TRI_COUNTY_FIPS.has(String(feature.id))}
						d={fitted.counties[i]}
					/>
				{/each}
			{/if}
		</g>

		<!--
			SVG has no cross-element z-index for plain shapes; paint order is DOM
			order, full stop. So dots, labels and tooltips are three separate layers
			rather than interleaved per-city groups: that is what guarantees every
			label paints above every dot, and every tooltip above everything, no
			matter which city comes first in the data.
		-->
		<g class="demogMarkers">
			<g class="demogDotsLayer">
				{#each cities as city, i (city.name)}
					<g
						class="demogCity"
						class:hovered={hovered === city.name}
						transform={fitted ? at(i) : undefined}
						onpointerenter={() => show(city.name)}
						onpointerleave={() => show(null)}
						onclick={(e) => {
							e.stopPropagation();
							show(city.name);
						}}
						role="presentation"
					>
						<circle class="demogDot" r={radii[i].toFixed(1)} />
					</g>
				{/each}
			</g>

			<g class="demogLabelsLayer">
				{#each paintOrder as i (cities[i].name)}
					{@const city = cities[i]}
					<g
						class="demogCity {modes[i]}"
						class:hovered={hovered === city.name}
						transform={fitted ? at(i) : undefined}
						onpointerenter={() => show(city.name)}
						onpointerleave={() => show(null)}
						onclick={(e) => {
							e.stopPropagation();
							show(city.name);
						}}
						role="presentation"
					>
						<!-- paint order within a label is DOM order too: pill, then text -->
						<rect
							class="demogLabelBg"
							x={pills[i]?.x}
							y={pills[i]?.y}
							width={pills[i]?.width}
							height={pills[i]?.height}
							rx={pills[i]?.rx}
						/>
						<text class="demogDotLabel" x={labelTextX(radii[i])} y="4" bind:this={labelText[i]}
							>{city.name}</text
						>
						<text class="demogMiniLabel" x={miniLabelX(radii[i])}>{city.name}</text>
					</g>
				{/each}
			</g>

			<g class="demogHoverLayer">
				{#each cities as city, i (city.name)}
					<g
						class="demogCity"
						class:hovered={hovered === city.name}
						transform={fitted ? at(i) : undefined}
						onpointerenter={() => show(city.name)}
						onpointerleave={() => show(null)}
						onclick={(e) => {
							e.stopPropagation();
							show(city.name);
						}}
						role="presentation"
					>
						<rect
							class="demogHoverBg"
							x={tooltips[i]?.x}
							y={tooltips[i]?.y}
							width={tooltips[i]?.width}
							height={tooltips[i]?.height}
							rx={tooltips[i]?.rx}
						/>
						<text class="demogHoverName" x={labelTextX(radii[i])} y="0" bind:this={hoverName[i]}
							>{city.name}</text
						>
						<text class="demogHoverCount" x={labelTextX(radii[i])} y="21" bind:this={hoverCount[i]}
							>{city.count}{city.count === 1 ? ' person' : ' people'}</text
						>
					</g>
				{/each}
			</g>
		</g>
	</svg>
</div>

<style>
	/* Full-bleed behind the whole page. overflow:hidden is cheap defensive
	   insurance on top of d3-zoom's own translateExtent clamp. Dragging pans
	   the map, never the page. */
	.demogMap {
		position: absolute;
		inset: 0;
		overflow: hidden;
		z-index: 1;
		cursor: move;
		touch-action: none;
	}
	.demogMap > svg {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
	/* fixed so the map fills the whole window below the top bar, not just the
	   column; the stat block stays centred in the column on top of it */
	@media (min-width: 660px) {
		.demogMap {
			position: fixed;
			inset: var(--topbar-h) 0 0;
		}
	}
	/* vector-effect:non-scaling-stroke keeps the boundary lines a constant
	   screen width across zoom levels */
	.demogCounty {
		fill: none;
		stroke: rgba(255, 255, 255, 0.35);
		stroke-width: 0.75px;
		vector-effect: non-scaling-stroke;
	}
	.demogCounty.inRegion {
		fill: var(--gold);
		fill-opacity: 0.16;
	}
	.demogBg {
		fill: transparent;
	}
	.demogCity {
		cursor: pointer;
	}
	.demogDot {
		fill: var(--gold);
	}
	.demogLabelBg {
		fill: var(--home);
		pointer-events: none;
	}
	.demogDotLabel {
		font-family: var(--geom);
		font-weight: 600;
		font-size: 16px;
		fill: #fff;
		pointer-events: none;
	}
	.demogMiniLabel {
		font-family: var(--mono);
		font-weight: 500;
		font-size: 9px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		fill: #fff;
		fill-opacity: 0.6;
		dominant-baseline: middle;
		pointer-events: none;
	}
	/* which of the two labels shows comes from labelModeFor in
	   domain/map-layout.ts, as a class on each place */
	.demogLabelBg,
	.demogDotLabel,
	.demogMiniLabel {
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	.demogCity.pill .demogLabelBg,
	.demogCity.pill .demogDotLabel,
	.demogCity.mini .demogMiniLabel {
		opacity: 1;
	}
	/* hovering a visible pill opens the tooltip; a hidden one must not catch
	   the pointer meant for a neighbouring place */
	.demogCity.pill .demogLabelBg {
		pointer-events: auto;
	}
	/* The tooltip sits at the label's anchor, in its own layer so it paints
	   above every dot and label. pointer-events:none while hidden, so an
	   invisible tooltip never blocks a nearby city; auto once shown, so moving
	   onto the box itself keeps it open. */
	.demogHoverBg {
		fill: var(--home);
		pointer-events: none;
	}
	.demogCity.hovered .demogHoverBg {
		pointer-events: auto;
	}
	.demogHoverName {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 20px;
		fill: #fff;
		pointer-events: none;
	}
	.demogHoverCount {
		font-family: var(--mono);
		font-size: 14px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		fill: rgba(255, 255, 255, 0.7);
		pointer-events: none;
	}
	.demogHoverBg,
	.demogHoverName,
	.demogHoverCount {
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.demogCity.hovered .demogHoverBg,
	.demogCity.hovered .demogHoverName,
	.demogCity.hovered .demogHoverCount {
		opacity: 1;
	}
</style>
