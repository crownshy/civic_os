<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '@civicos/shared/utils';
	import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {
		areaIdsInView,
		buildMapLayers,
		createRequestLog,
		mapViewOf,
		type AreaGeometry,
		type PlaceGeometrySource,
		type PlaceMapLayers
	} from './geometry';
	import type { PlaceSelectorState } from './place-selector.svelte';
	import type { Bbox } from './places';

	type Props = {
		/** The selector the chips and picker share, so the map follows them. */
		state: PlaceSelectorState;
		/** Where boundaries come from. Only areas on screen are asked for, once each. */
		geometrySource: PlaceGeometrySource;
		/** The row hovered or focused in the picker, highlighted on the map. */
		hoveredId?: string | null;
		class?: string;
	};

	let { state: selector, geometrySource, hoveredId = null, class: className }: Props = $props();

	// Ink, muted dots and label halos match the basemap rather than page tokens: admin
	// has no dark surface palette, so --foreground would vanish on Dark Matter.
	const BASEMAPS = {
		light: {
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			ink: '#1b2421',
			muted: '#5a6762',
			halo: '#ffffff'
		},
		dark: {
			style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
			ink: '#e7ecea',
			muted: '#9ba7a2',
			halo: '#121615'
		}
	};
	/** The fixture's three states, so the first paint is never the whole world. */
	const FALLBACK_BOUNDS: Bbox = [-124.6, 32.5, -109, 46.3];
	const FIT_PADDING = 40;
	const FIT_MAX_ZOOM = 11;
	const FLY_DURATION_MS = 600;
	const LABEL_FONT = ['Montserrat SemiBold', 'Open Sans Bold'];
	const SOURCES: (keyof PlaceMapLayers)[] = ['listed', 'selected', 'hovered', 'drilled', 'cities'];

	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let ready = $state(false);
	let errorMessage = $state('');
	let geometries = $state.raw<ReadonlyMap<string, AreaGeometry>>(new Map());
	const requests = createRequestLog();
	let lastFrame: Bbox | null = null;

	const view = $derived(mapViewOf(selector, hoveredId));
	const layers = $derived(buildMapLayers(view, geometries));
	const description = $derived.by(() => {
		if (view.drilled) return `Map of ${view.drilled.name} and the places in it.`;
		if (selector.mode === 'edit' && selector.isSearching) {
			return `Map of ${view.listed.length} search matches.`;
		}
		if (view.selected.length === 0) return 'Map with no places selected.';
		return `Map of the selected places: ${view.selected.map((place) => place.name).join(', ')}.`;
	});

	$effect(() => {
		const missing = requests.claim(areaIdsInView(view));
		if (missing.length === 0) return;
		geometrySource.geometries(missing).then(
			(loaded) => {
				geometries = new Map([...geometries, ...loaded]);
			},
			() => {
				requests.release(missing);
				errorMessage = 'Some boundaries could not load.';
			}
		);
	});

	$effect(() => {
		if (!ready || !map) return;
		for (const name of SOURCES) {
			(map.getSource(name) as GeoJSONSource | undefined)?.setData(layers[name]);
		}
	});

	$effect(() => {
		const frame = selector.frame;
		if (!ready || !map || !frame || sameBbox(frame, lastFrame)) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const duration = reduceMotion || !lastFrame ? 0 : FLY_DURATION_MS;
		lastFrame = frame;
		map.fitBounds(frame, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration });
	});

	function sameBbox(a: Bbox, b: Bbox | null): boolean {
		return b !== null && a.every((value, index) => value === b[index]);
	}

	/** MapLibre paint takes real colours, not `var()`, so read the level tokens off the page. */
	function readColours(basemap: (typeof BASEMAPS)['light']) {
		const style = getComputedStyle(container);
		const token = (name: string, fallback: string) =>
			style.getPropertyValue(name).trim() || fallback;
		return {
			state: token('--color-place-state', '#3846bf'),
			county: token('--color-place-county', '#0c765d'),
			city: token('--color-place-city', '#b35208'),
			ink: basemap.ink,
			muted: basemap.muted,
			halo: basemap.halo
		};
	}

	function addLayers(target: MapLibreMap, basemap: (typeof BASEMAPS)['light']) {
		const colours = readColours(basemap);
		const levelColour: ExpressionSpecification = [
			'match',
			['get', 'level'],
			'state',
			colours.state,
			'county',
			colours.county,
			colours.city
		];
		const emphasised: ExpressionSpecification = ['any', ['get', 'selected'], ['get', 'hovered']];

		for (const name of SOURCES) {
			target.addSource(name, { type: 'geojson', data: layers[name] });
		}
		target.addLayer({
			id: 'listed-outline',
			type: 'line',
			source: 'listed',
			paint: { 'line-color': levelColour, 'line-width': 0.8, 'line-opacity': 0.4 }
		});
		target.addLayer({
			id: 'selected-fill',
			type: 'fill',
			source: 'selected',
			paint: { 'fill-color': levelColour, 'fill-opacity': 0.18 }
		});
		target.addLayer({
			id: 'hovered-fill',
			type: 'fill',
			source: 'hovered',
			paint: { 'fill-color': levelColour, 'fill-opacity': 0.3 }
		});
		target.addLayer({
			id: 'selected-outline',
			type: 'line',
			source: 'selected',
			paint: {
				'line-color': levelColour,
				'line-width': ['match', ['get', 'level'], 'state', 2, 1.6]
			}
		});
		target.addLayer({
			id: 'hovered-outline',
			type: 'line',
			source: 'hovered',
			paint: { 'line-color': levelColour, 'line-width': 2.4 }
		});
		target.addLayer({
			id: 'drilled-outline',
			type: 'line',
			source: 'drilled',
			paint: { 'line-color': colours.ink, 'line-width': 1.4, 'line-dasharray': [3, 2.5] }
		});
		target.addLayer({
			id: 'city-muted',
			type: 'circle',
			source: 'cities',
			filter: ['!', emphasised],
			paint: { 'circle-radius': 3, 'circle-color': colours.muted, 'circle-opacity': 0.75 }
		});
		target.addLayer({
			id: 'city-hover-ring',
			type: 'circle',
			source: 'cities',
			filter: ['get', 'hovered'],
			paint: {
				'circle-radius': 9,
				'circle-opacity': 0,
				'circle-stroke-width': 2,
				'circle-stroke-color': colours.city
			}
		});
		target.addLayer({
			id: 'city-solid',
			type: 'circle',
			source: 'cities',
			filter: emphasised,
			paint: {
				'circle-radius': 5,
				'circle-color': colours.city,
				'circle-stroke-width': 2,
				'circle-stroke-color': colours.halo
			}
		});
		target.addLayer({
			id: 'city-label',
			type: 'symbol',
			source: 'cities',
			filter: emphasised,
			layout: {
				'text-field': ['get', 'name'],
				'text-font': LABEL_FONT,
				'text-size': 13,
				'text-anchor': 'left',
				'text-offset': [0.9, 0]
			},
			paint: { 'text-color': colours.ink, 'text-halo-color': colours.halo, 'text-halo-width': 2 }
		});
	}

	onMount(() => {
		let disposed = false;
		let observer: ResizeObserver | undefined;

		import('maplibre-gl').then(
			(maplibre) => {
				if (disposed) return;
				const basemap = container.closest('.dark') ? BASEMAPS.dark : BASEMAPS.light;
				const created = new maplibre.Map({
					container,
					style: basemap.style,
					bounds: selector.frame ?? FALLBACK_BOUNDS,
					fitBoundsOptions: { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM },
					attributionControl: { compact: true }
				});
				map = created;
				created.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
				created.on('load', () => {
					if (disposed) return;
					addLayers(created, basemap);
					lastFrame = selector.frame;
					ready = true;
				});
				created.on('error', () => {
					errorMessage = 'Some map data could not load.';
				});
				observer = new ResizeObserver(() => created.resize());
				observer.observe(container);
			},
			() => {
				errorMessage = 'The map could not load.';
			}
		);

		return () => {
			disposed = true;
			observer?.disconnect();
			map?.remove();
			map = undefined;
		};
	});
</script>

<figure
	class={cn(
		'relative m-0 h-full min-h-64 w-full overflow-hidden rounded-md border bg-muted',
		className
	)}
>
	<figcaption class="sr-only">{description}</figcaption>
	<!-- absolute! because maplibre-gl.css sets .maplibregl-map to position: relative. -->
	<div bind:this={container} class="absolute! inset-0"></div>

	<ul
		class="absolute bottom-2 left-2 flex flex-col gap-1 rounded-md bg-background/90 px-2.5 py-2 text-label text-foreground shadow-sm"
		aria-label="Map legend"
	>
		<li class="flex items-center gap-2">
			<span class="size-3 rounded-sm border-2 border-place-state bg-place-state/20"></span>State
		</li>
		<li class="flex items-center gap-2">
			<span class="size-3 rounded-sm border-2 border-place-county bg-place-county/20"></span>County
		</li>
		<li class="flex items-center gap-2">
			<span class="size-3 rounded-full bg-place-city"></span>City or town
		</li>
	</ul>

	{#if errorMessage}
		<p
			role="alert"
			class="absolute top-2 left-2 rounded-md bg-background/90 px-2.5 py-1.5 text-caption text-destructive shadow-sm"
		>
			{errorMessage}
		</p>
	{/if}
</figure>
