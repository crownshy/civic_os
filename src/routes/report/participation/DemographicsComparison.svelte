<script lang="ts">
	import type { DemographicTarget } from "$lib/config/regions";

  type Props ={
	targets?: Array<DemographicTarget>,
	data: Array<{value:string , count:number}>,
	title: String
  }

  let {targets,data,title}: Props = $props()

  let targetLookup = $derived(targets?.reduce((t,a)=> ({...t , [a.id] : {target: a.target,total: a.total}}) ,{}))

</script>

<div class="mt-4 px-8">

  <h2 class="my-4 font-sans text-2xl font-bold leading-[1.01]" >
    {title}
  </h2>


  {#if targets}

	{#each data as datum}
	  <p> 
	  <span>{datum.value}: Count: {datum.count},</span> 

	  {#if targetLookup && targetLookup[datum.value]}
		<span>
			Target: {targetLookup[datum.value].target}, 
			Progress: {Math.floor(datum.count*100/targetLookup[datum.value].target)}%, 
			Total: {targetLookup[datum.value].total} 
		</span>	
	  {:else}
		<span>No target set</span>
	  {/if}  
	  </p>
  {/each}
  {:else}
	<p>No targets set</p>
  {/if}
</div>
