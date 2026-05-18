<script lang="ts">
  import type { RegionConfig } from '$lib/config/regions';
  import { FillLayer, GeoJSON, LineLayer, MapLibre } from 'svelte-maplibre';
  import { center } from "@turf/center";
	import { ZipCountyCrosswalk } from '$lib/data/zip_county_crosswalk';

  const fillColor="#FF0000"
  const borderColor="#00FF00"

  let counties = $state(null)
  let mapCenter = $state([0,0])
  let countiesLoaded =$state(false)

  type Props={
	region: RegionConfig,
	data: Map<string,number>,
	targets:Map<string,number>
  }

  let {region, data} : Props= $props()

  let countyCounts  = $derived.by(()=>{
	let counts ={}
	for (const [zip, count] of  Object.entries(data)){
	  let county = ZipCountyCrosswalk.find(zc=>String(zc.ZIP).padStart(5,"0") === zip)
	  let countyKey = String(county.STCOUNTYFP)
	  counts[countyKey] = counts[countyKey] ? counts[countyKey]+ count : count 
	}
	return counts
  })


  // let countyTargetProgress  = $derived.by(()=>{
	 //  let targetProgres = {}
	 //  for (const [target, count] of  Object.entries(data)){
		// countyCount	
	 //  })
  // })

  $inspect("county counts ", countyCounts)

  $effect(()=>{
	fetch("/counties.geojson").then((res)=>res.json()).then(
	  (geojson)=>{
		countiesLoaded = true

		let filteredCounties  = geojson.features.filter(f=>{
		  let zip =ZipCountyCrosswalk.find(zc=>String(zc.STCOUNTYFP) === f.properties.GEOID)
		  if (zip){
			
			return region.zipPrefixes.includes(String(zip.ZIP).padStart(5,"0").slice(0,2)) 
		  }
		  return false
		});

		counties = {...geojson, features:filteredCounties }
		let c = center(counties)
		mapCenter = c.geometry.coordinates
	  }
	)
  })



</script>

<div>
  {#if countiesLoaded && counties}
	<MapLibre 
	center={mapCenter}
	zoom={5}
	class="map"
	standardControls
	style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json">

	  <GeoJSON id="states" data={counties} promoteId="GEOID">
		<FillLayer
		  paint={{
		    'fill-color': fillColor,
		    'fill-opacity': 0.5,
		  }}
		  manageHoverState
		/>
		<LineLayer
		  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
		  paint={{ 'line-color': borderColor, 'line-width': 3 }}
		  beforeLayerType="symbol"
		/>
	</GeoJSON>

	</MapLibre>

  {/if}

</div>

<style>
  :global(.map) {
    height: 500px;
  }
</style>
