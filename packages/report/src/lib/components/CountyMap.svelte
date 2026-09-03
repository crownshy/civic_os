<script lang="ts">
	import { geoMercator, geoPath, type ExtendedFeatureCollection } from 'd3-geo';
	import { select } from 'd3-selection';
	import 'd3-transition';
	import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';

	import { OREGON_COUNTIES, PARTICIPANT_LOCATIONS } from '../domain/bundled';
	import {
		DEMOG_MAX_ZOOM_IN,
		DEMOG_RESET_DURATION,
		TRI_COUNTY_FIPS,
		dotRadius,
		homeFitExtent,
		hoverBox,
		labelTextX,
		labelVisibility,
		minZoomScale,
		pillBox,
		type Box
	} from '../domain/map-layout';

	const cities = PARTICIPANT_LOCATIONS.cities;
	const maxCount = Math.max(...cities.map((c) => c.count));
	/** Radius never changes with zoom: markers keep a fixed screen size. */
	const radii = cities.map((city) => dotRadius(city.count, maxCount));

	// d3-geo takes points as [lng, lat], the reverse of these field names' own
	// reading order (see participant-locations.json's _readme)
	const cityPoints: ExtendedFeatureCollection = {
		type: 'FeatureCollection',
		features: cities.map((c) => ({
			type: 'Feature',
			properties: null,
			geometry: { type: 'Point', coordinates: [c.lng, c.lat] }
		}))
	};

	// the bundled GeoJSON is asserted, not validated, same boundary cast as
	// domain/bundled.ts makes for the rest of the data
	const counties = OREGON_COUNTIES as unknown as ExtendedFeatureCollection;

	const projection = geoMercator();
	const path = geoPath(projection);

	let frame = $state<HTMLDivElement>();
	let svg = $state<SVGSVGElement>();
	let size = $state({ width: 0, height: 0 });
	let transform = $state<ZoomTransform>(zoomIdentity);
	let hovered = $state<string | null>(null);

	/**
	 * Fitting the projection is a mutation, so everything read off it is derived
	 * in the same pass: county paths, each city's projected point, and the
	 * bounds the zoom's limits come from.
	 */
	const fitted = $derived.by(() => {
		const { width, height } = size;
		if (width <= 0 || height <= 0) return null;
		projection.fitExtent(homeFitExtent(width, height), cityPoints);
		return {
			counties: counties.features.map((f) => path(f) ?? ''),
			projected: cities.map(
				(c) => (projection([c.lng, c.lat] as [number, number]) ?? [0, 0]) as [number, number]
			),
			bounds: path.bounds(counties) as [[number, number], [number, number]]
		};
	});

	const tiers = $derived(labelVisibility(transform.k));

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

	/**
	 * getBBox() reads the text's own rendered geometry, independent of the svg's
	 * viewBox or zoom transform, so this is safe before the projection has ever
	 * been fitted. Measured once: the text and its offset never change.
	 */
	$effect(() => {
		if (pills.length || !labelText.length || labelText.some((t) => !t)) return;
		pills = labelText.map((t) => pillBox(t.getBBox()));
		tooltips = hoverName.map((n, i) => hoverBox(n.getBBox(), hoverCount[i].getBBox()));
	});

	// --- pan/zoom -------------------------------------------------------------
	let behaviour: ZoomBehavior<SVGSVGElement, unknown> | null = null;

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
		sel.call(z.transform, zoomIdentity); // a resize always returns to the home view
		behaviour = z;

		return () => {
			sel.on('.zoom', null);
			behaviour = null;
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
				size = { width: rect.width, height: rect.height };
			}, 220);
		});
		observer.observe(el);
		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	});

	export function reset() {
		hovered = null;
		if (!svg || !behaviour) return;
		const sel = select<SVGSVGElement, unknown>(svg);
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		(reduced ? sel : sel.transition().duration(DEMOG_RESET_DURATION)).call(
			behaviour.transform,
			zoomIdentity
		);
	}

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
		<g
			class="demogMarkers"
			class:labelsHidden={tiers.labelsHidden}
			class:minorLabelsShown={tiers.minorLabelsShown}
		>
			<g class="demogDotsLayer">
				{#each cities as city, i (city.name)}
					<g
						class="demogCity"
						class:minor={!city.major}
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
				{#each cities as city, i (city.name)}
					<g
						class="demogCity"
						class:minor={!city.major}
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
					</g>
				{/each}
			</g>

			<g class="demogHoverLayer">
				{#each cities as city, i (city.name)}
					<g
						class="demogCity"
						class:minor={!city.major}
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
	.demogMap > svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	/* county fill/stroke: vector-effect:non-scaling-stroke keeps the boundary
	   lines a constant screen width across zoom levels, the CSS-only half of
	   the "stays legible at any zoom" requirement (the other half, keeping
	   city marker/label size constant, is handled in JS; see demogZoomed()) */
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
		fill-opacity: 0.9;
	}
	/* white pill behind each city name, tucked slightly under the dot's edge
	   (see DEMOG_LABEL_OVERLAP in domain/map-layout.ts) so the two visibly overlap */
	.demogLabelBg {
		fill: #fff;
		pointer-events: none;
	}
	.demogDotLabel {
		font-family: var(--geom);
		font-weight: 600;
		font-size: 16px;
		fill: var(--home);
		pointer-events: none;
	}
	/* major-city labels fade out once you've zoomed out past DEMOG_LABEL_MIN_ZOOM,
	   so a wide view reads as dots-in-context rather than a wall of pills. The 7
	   smaller places (.minor) start hidden and only appear once you've zoomed in
	   past DEMOG_MINOR_LABEL_MIN_ZOOM, kept simple for now/deliberately equal in
	   every other way (size, color) rather than visually downweighting them. */
	.demogLabelBg,
	.demogDotLabel {
		transition: opacity 0.2s ease;
	}
	.demogMarkers.labelsHidden .demogCity:not(.minor) .demogLabelBg,
	.demogMarkers.labelsHidden .demogCity:not(.minor) .demogDotLabel {
		opacity: 0;
	}
	.demogCity.minor .demogLabelBg,
	.demogCity.minor .demogDotLabel {
		opacity: 0;
	}
	.demogMarkers.minorLabelsShown .demogCity.minor .demogLabelBg,
	.demogMarkers.minorLabelsShown .demogCity.minor .demogDotLabel {
		opacity: 1;
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
	/* darker at the very top, settling into the flat --agree green (same token
	   .who.consensus's pill already uses; "consensus" and "agree" are the
	   same color throughout the report) by ~20% down the page */

	/* the county map, a sibling of .masthead, not inside it. Full-bleed behind
	   the whole page: real Oregon county geometry (data/oregon-counties.json)
	   rendered and panned/zoomed by d3-geo and d3-zoom. overflow:hidden is
	   cheap defensive insurance on top of d3-zoom's own translateExtent clamp. */
	.demogMap {
		position: absolute;
		inset: 0;
		overflow: hidden;
		z-index: 1;
	}
	/* hover/tap info tooltip: sits in the same spot as the plain pill label
	   (same overlap anchor, see DEMOG_LABEL_OVERLAP), just a taller two-line
	   dark card instead of a one-line white pill. Lives in its own layer
	   (.demogHoverLayer, painted after dots and labels) so it
	   always paints above every dot/label, on any city, at any zoom. */
	/* pointer-events:none while hidden, so an invisible tooltip never blocks a
	   nearby city's dot/label; auto once .hovered, so drifting the mouse onto
	   the now-visible box itself keeps it open instead of immediately flickering
	   away the instant it stops being over the dot/label that triggered it */
	.demogHoverBg {
		fill: var(--home);
		pointer-events: none;
	}
</style>
