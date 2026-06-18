<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	interface Props {
		center: [number, number];
		zoom?: number;
		/** Optional point markers: { coord: [lng, lat], count: number } */
		points?: Array<{ coord: [number, number]; count: number; label?: string }>;
		class?: string;
	}

	let { center, zoom = 6, points = [], class: className = '' }: Props = $props();

	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;

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
			center,
			zoom,
			attributionControl: false
		});

		map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

		const maxCount = Math.max(1, ...points.map((p) => p.count));
		for (const p of points) {
			const el = document.createElement('div');
			const size = 10 + (p.count / maxCount) * 30;
			el.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:rgba(234,88,12,0.6);border:2px solid #ea580c;box-shadow:0 0 0 2px rgba(255,255,255,0.8);`;
			el.title = p.label ? `${p.label}: ${p.count}` : `${p.count}`;
			new maplibregl.Marker({ element: el }).setLngLat(p.coord).addTo(map);
		}
	});

	onDestroy(() => map?.remove());
</script>

<div bind:this={container} class={`h-full w-full ${className}`}></div>
