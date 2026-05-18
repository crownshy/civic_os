<script lang="ts">
  import type { RegionConfig } from '$lib/config/regions';
  import { FillLayer, GeoJSON, LineLayer, MapLibre } from 'svelte-maplibre';
  import { center } from "@turf/center";
  import { ZipCountyCrosswalk } from '$lib/data/zip_county_crosswalk';

  const borderColor = "#6b7280"

  const LEGEND_STEPS = [
    { label: '0–10%',    color: '#a50026' },
    { label: '10–20%',   color: '#d73027' },
    { label: '20–30%',   color: '#f46d43' },
    { label: '30–40%',   color: '#fdae61' },
    { label: '40–50%',   color: '#fee08b' },
    { label: '50–60%',   color: '#ffffbf' },
    { label: '60–70%',   color: '#d9ef8b' },
    { label: '70–80%',   color: '#a6d96a' },
    { label: '80–90%',   color: '#66bd63' },
    { label: '90–100%',  color: '#1a9850' },
    { label: '100%+',    color: '#006837' },
    { label: 'No target', color: '#d1d5db' },
  ]

  let rawCounties = $state(null)
  let mapCenter = $state([0, 0])
  let countiesLoaded = $state(false)
  let map = $state(null)

  type TooltipData = {
    x: number
    y: number
    name: string
    count: number
    target: number | null
    total: number | null
    progress: number | null
  }
  let tooltipData = $state<TooltipData | null>(null)

  type Props = {
    region: RegionConfig
    data: Record<string, number>
    targets?: Array<{ id: string; target: number; total: number }>
  }

  let { region, data, targets }: Props = $props()

  let countyCounts = $derived.by(() => {
    const counts: Record<string, number> = {}
    for (const [zip, count] of Object.entries(data ?? {})) {
      const county = ZipCountyCrosswalk.find(zc => String(zc.ZIP).padStart(5, "0") === zip)
      if (county) {
        const key = String(county.STCOUNTYFP)
        counts[key] = (counts[key] ?? 0) + count
      }
    }
    return counts
  })

  let countyTargetLookup = $derived(
    targets?.reduce(
      (t, a) => ({ ...t, [a.id]: a.target }),
      {} as Record<string, number>
    ) ?? {}
  )

  let countyTotalLookup = $derived(
    targets?.reduce(
      (t, a) => ({ ...t, [a.id]: a.total }),
      {} as Record<string, number>
    ) ?? {}
  )

  let coloredCounties = $derived(
    rawCounties
      ? {
          ...rawCounties,
          features: rawCounties.features.map(f => {
            const geoid = f.properties.GEOID
            const count = countyCounts[geoid] ?? 0
            const target = countyTargetLookup[geoid]
            const progress = target != null ? count / target : -1
            return { ...f, properties: { ...f.properties, progress } }
          })
        }
      : null
  )

  $effect(() => {
    fetch("/counties.geojson").then(res => res.json()).then(geojson => {
      const filtered = geojson.features.filter(f => {
        const zip = ZipCountyCrosswalk.find(zc => String(zc.STCOUNTYFP) === f.properties.GEOID)
        if (zip) {
          return region.zipPrefixes.includes(String(zip.ZIP).padStart(5, "0").slice(0, 2))
        }
        return false
      })
      rawCounties = { ...geojson, features: filtered }
      mapCenter = center(rawCounties).geometry.coordinates
      countiesLoaded = true
    })
  })

  $effect(() => {
    if (!map) return

    function onMove(e) {
      if (!e.features?.length) return
      const f = e.features[0]
      const geoid = f.properties.GEOID
      const progress = f.properties.progress
      tooltipData = {
        x: e.point.x,
        y: e.point.y,
        name: f.properties.NAME ?? geoid,
        count: countyCounts[geoid] ?? 0,
        target: countyTargetLookup[geoid] ?? null,
        total: countyTotalLookup[geoid] ?? null,
        progress: progress >= 0 ? progress : null,
      }
      map.getCanvas().style.cursor = 'pointer'
    }

    function onLeave() {
      tooltipData = null
      map.getCanvas().style.cursor = ''
    }

    map.on('mousemove', 'counties-fill', onMove)
    map.on('mouseleave', 'counties-fill', onLeave)

    return () => {
      map.off('mousemove', 'counties-fill', onMove)
      map.off('mouseleave', 'counties-fill', onLeave)
    }
  })
</script>

<div class="relative">
    <MapLibre
      bind:map
      center={mapCenter}
      zoom={5}
      class="map"
      standardControls
      style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
	{#if countiesLoaded && coloredCounties}
      <GeoJSON id="counties" data={coloredCounties} promoteId="GEOID">
        <FillLayer
          id="counties-fill"
          paint={{
            'fill-color': [
              'step', ['get', 'progress'],
              '#d1d5db',
              0.0, '#a50026',
              0.1, '#d73027',
              0.2, '#f46d43',
              0.3, '#fdae61',
              0.4, '#fee08b',
              0.5, '#ffffbf',
              0.6, '#d9ef8b',
              0.7, '#a6d96a',
              0.8, '#66bd63',
              0.9, '#1a9850',
              1.0, '#006837'
            ],
            'fill-opacity': 0.8
          }}
          manageHoverState
        />
        <LineLayer
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': borderColor, 'line-width': 1.5 }}
          beforeLayerType="symbol"
        />
      </GeoJSON>
	{/if}
    </MapLibre>

    <!-- Tooltip -->
    {#if tooltipData}
      <div
        class="pointer-events-none absolute z-10 min-w-40 rounded-md border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm"
        style="left: {tooltipData.x + 14}px; top: {tooltipData.y + 14}px;"
      >
        <p class="mb-2 font-sans text-sm font-semibold text-foreground">{tooltipData.name}</p>
        <div class="flex flex-col gap-0.5 font-mono text-xs text-muted-foreground">
          <div class="flex justify-between gap-4">
            <span>count</span>
            <span class="text-foreground">{tooltipData.count}</span>
          </div>
          {#if tooltipData.target != null}
            <div class="flex justify-between gap-4">
              <span>target</span>
              <span class="text-foreground">{tooltipData.target}</span>
            </div>
          {/if}
          {#if tooltipData.total != null}
            <div class="flex justify-between gap-4">
              <span>total</span>
              <span class="text-foreground">{tooltipData.total}</span>
            </div>
          {/if}
          {#if tooltipData.progress != null}
            <div class="flex justify-between gap-4 border-t border-border pt-1 mt-1">
              <span>progress</span>
              <span class="font-semibold text-foreground">{Math.round(tooltipData.progress * 100)}%</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Legend -->
    <div class="absolute bottom-8 right-2 rounded-md border border-border bg-background/90 p-3 shadow-md backdrop-blur-sm">
      <p class="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        % of target
      </p>
      <div class="flex flex-col gap-1">
        {#each LEGEND_STEPS as step (step.label)}
          <div class="flex items-center gap-2">
            <span class="h-3 w-5 shrink-0 rounded-sm border border-black/10" style="background-color: {step.color};"></span>
            <span class="font-mono text-[11px] text-foreground">{step.label}</span>
          </div>
        {/each}
      </div>
    </div>
</div>

<style>
  :global(.map) {
    height: 500px;
  }
</style>
