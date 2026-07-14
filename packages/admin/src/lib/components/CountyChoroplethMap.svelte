<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	interface CountyDatum {
		count: number;
		goal?: number;
	}

	interface Props {
		/** USPS state codes whose county GeoJSON to load (e.g. ["UT"]). */
		states: string[];
		/** Participation + goal per county name (matches GeoJSON feature NAME). */
		countyData: Record<string, CountyDatum>;
		class?: string;
	}

	let { states, countyData, class: className = '' }: Props = $props();

	// Fill palette. Under-goal counties run deep→light red the further they are
	// from goal; at/over goal is a flat green; a county with no goal set is gray.
	const MET = '#16a34a'; // meter-met green-600
	const DEEP_RED = '#7f1d1d'; // red-900 — furthest from goal
	const LIGHT_RED = '#fecaca'; // red-200 — just short of goal
	const NO_GOAL = '#d4d4d4'; // neutral-300

	function hexToRgb(hex: string): [number, number, number] {
		const n = parseInt(hex.slice(1), 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}
	function lerpHex(a: string, b: string, t: number): string {
		const ca = hexToRgb(a);
		const cb = hexToRgb(b);
		const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
		return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
	}

	function colorFor(datum: CountyDatum | undefined): string {
		if (!datum || datum.goal == null || datum.goal <= 0) return NO_GOAL;
		if (datum.count >= datum.goal) return MET;
		const ratio = Math.max(0, Math.min(1, datum.count / datum.goal));
		return lerpHex(DEEP_RED, LIGHT_RED, ratio);
	}

	type Coords = number[] | Coords[];
	interface Feature {
		type: 'Feature';
		properties: Record<string, unknown>;
		geometry: { type: string; coordinates: Coords };
	}
	interface FeatureCollection {
		type: 'FeatureCollection';
		features: Feature[];
	}

	// Grow a [west, south, east, north] bbox over any Polygon/MultiPolygon ring.
	function extendBounds(bounds: [number, number, number, number], coords: Coords): void {
		if (typeof coords[0] === 'number') {
			const [lng, lat] = coords as [number, number];
			bounds[0] = Math.min(bounds[0], lng);
			bounds[1] = Math.min(bounds[1], lat);
			bounds[2] = Math.max(bounds[2], lng);
			bounds[3] = Math.max(bounds[3], lat);
			return;
		}
		for (const c of coords as Coords[]) extendBounds(bounds, c);
	}

	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let mapReady = $state(false);
	let loadError = $state<string | null>(null);
	const SOURCE_ID = 'counties';

	async function buildCollection(codes: string[]): Promise<FeatureCollection> {
		const collections = await Promise.all(
			codes.map(async (code) => {
				const res = await fetch(`${base}/counties/counties_${code}.geojson`);
				if (!res.ok) throw new Error(`counties_${code} ${res.status}`);
				return (await res.json()) as FeatureCollection;
			})
		);
		const features: Feature[] = [];
		for (const fc of collections) {
			for (const f of fc.features) {
				const name = String(f.properties.NAME ?? f.properties.name ?? '');
				const datum = countyData[name];
				f.properties = {
					...f.properties,
					_name: name,
					_count: datum?.count ?? 0,
					_goal: datum?.goal ?? null,
					_fill: colorFor(datum)
				};
				features.push(f);
			}
		}
		return { type: 'FeatureCollection', features };
	}

	function applyCollection(fc: FeatureCollection): void {
		if (!map) return;
		const existing = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
		if (existing) {
			existing.setData(fc as never);
		} else {
			map.addSource(SOURCE_ID, { type: 'geojson', data: fc as never });
			map.addLayer({
				id: 'county-fill',
				type: 'fill',
				source: SOURCE_ID,
				paint: { 'fill-color': ['get', '_fill'], 'fill-opacity': 0.72 }
			});
			map.addLayer({
				id: 'county-outline',
				type: 'line',
				source: SOURCE_ID,
				paint: { 'line-color': '#ffffff', 'line-width': 1 }
			});
			bindHover();
		}

		if (fc.features.length) {
			const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
			for (const f of fc.features) extendBounds(bounds, f.geometry.coordinates);
			if (Number.isFinite(bounds[0])) {
				map.fitBounds([bounds[0], bounds[1], bounds[2], bounds[3]], { padding: 24, duration: 0 });
			}
		}
	}

	function bindHover(): void {
		if (!map) return;
		const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
		map.on('mousemove', 'county-fill', (e) => {
			const f = e.features?.[0];
			if (!f || !map) return;
			map.getCanvas().style.cursor = 'pointer';
			const p = f.properties as Record<string, unknown>;
			const count = Number(p._count ?? 0);
			const goal = p._goal == null ? null : Number(p._goal);
			const pct = goal && goal > 0 ? Math.round((count / goal) * 100) : null;
			const goalLine =
				goal == null
					? 'No goal set'
					: `${count} / ${goal} goal${pct == null ? '' : ` (${pct}%)`}`;
			popup
				.setLngLat(e.lngLat)
				.setHTML(
					`<div style="font-size:12px;line-height:1.3"><strong>${p._name}</strong><br>${goalLine}</div>`
				)
				.addTo(map);
		});
		map.on('mouseleave', 'county-fill', () => {
			if (!map) return;
			map.getCanvas().style.cursor = '';
			popup.remove();
		});
	}

	onMount(() => {
		map = new maplibregl.Map({
			container,
			style: {
				version: 8,
				sources: {
					osm: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap'
					}
				},
				layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
				glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
			},
			center: [-98.5, 39.8],
			zoom: 3,
			attributionControl: false
		});
		map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
		map.on('load', () => {
			mapReady = true;
		});
	});

	onDestroy(() => map?.remove());

	// Rebuild the choropleth whenever the map is ready or its inputs change.
	$effect(() => {
		if (!mapReady || !map) return;
		const codes = states;
		void countyData; // re-run when goals/counts change
		if (!codes.length) return;
		let cancelled = false;
		loadError = null;
		buildCollection(codes)
			.then((fc) => {
				if (!cancelled) applyCollection(fc);
			})
			.catch((e) => {
				if (!cancelled) loadError = e instanceof Error ? e.message : String(e);
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class={`relative h-full w-full ${className}`}>
	<div bind:this={container} class="h-full w-full"></div>

	{#if states.length === 0}
		<div
			class="text-muted-foreground bg-muted/60 absolute inset-0 flex items-center justify-center text-center text-sm"
		>
			No geographic participation data yet.
		</div>
	{:else if loadError}
		<div
			class="text-destructive bg-muted/60 absolute inset-0 flex items-center justify-center text-center text-sm"
		>
			Couldn’t load county map: {loadError}
		</div>
	{/if}

	<!-- Legend -->
	<div
		class="bg-background/90 text-foreground/80 absolute bottom-2 left-2 rounded-md px-2.5 py-2 text-[11px] leading-tight shadow-sm"
	>
		<div class="mb-1 font-semibold">Participation vs. goal</div>
		<div class="flex items-center gap-1.5">
			<span class="inline-block h-3 w-3 rounded-sm" style="background:{DEEP_RED}"></span>
			<span class="inline-block h-3 w-3 rounded-sm" style="background:{LIGHT_RED}"></span>
			<span>Under goal</span>
			<span class="ml-2 inline-block h-3 w-3 rounded-sm" style="background:{MET}"></span>
			<span>Met</span>
			<span class="ml-2 inline-block h-3 w-3 rounded-sm" style="background:{NO_GOAL}"></span>
			<span>No goal</span>
		</div>
	</div>
</div>
