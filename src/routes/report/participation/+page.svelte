<script lang="ts">
	import DemographicsComparison from "./DemographicsComparison.svelte";
	import type { PageProps } from "./$types";
	import MapSection from "./MapSection.svelte";
	import AppShell from "$lib/components/layout/AppShell.svelte";
	import { DemographicReport } from "@crownshy/api-client/api";

  let {data} :PageProps= $props()
  let demographics = $derived(data.demographics)
  let age = $derived(demographics?.ageRanges)
  let gender = $derived(demographics?.gender)
  let politicalParty = $derived(demographics?.politicalParty)
  let ethnicity = $derived(demographics?.ethnicity)

  let region = $derived(data.region)
  let selectedSubregionId = $state<undefined | string>(undefined)
  console.log(demographics)
  console.log(region.targets)
</script>

<AppShell class="overflow-y-hidden!">

  <div class="h-full overflow-y-auto overflow-x-hidden">

  <h1 class="my-4 px-4 font-sans text-4xl font-bold leading-[1.01]">
	Participation report</h1>
	
	<MapSection {region} data={demographics?.zipcodeCounts} targets={region?.targets?.county} />

	<DemographicsComparison title='Age' data={age} targets={region?.targets['age']}/>
	<DemographicsComparison title='Gender' data={gender} targets={region?.targets['gender']}/>
	<DemographicsComparison title='Ethnicity' data={ethnicity} targets={region?.targets['ethnicity']}/>
	<DemographicsComparison title='Policital Party' data={politicalParty} targets={region?.targets['politicalParty']}/>
  </div>
</AppShell> 
