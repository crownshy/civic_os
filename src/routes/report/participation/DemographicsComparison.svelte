<script lang="ts">
  import type { DemographicTarget } from '$lib/config/regions';
  import { LayerCake, Svg } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import DemographicBars from './DemographicBars.svelte';

  type Props = {
    targets?: Array<DemographicTarget>;
    data: Array<{ value: string; count: number }>;
    title: String;
  };

  let { targets, data, title }: Props = $props();

  console.log({targets,data,title})

  let targetLookup = $derived(
    targets?.reduce(
      (t, a) => ({ ...t, [a.id]: { target: a.target, total: a.total } }),
      {} as Record<string, { target: number; total: number }>
    ) ?? {}
  );

  let totalCount = $derived((data ?? []).reduce((sum, d) => sum + d.count, 0));

  let noAnswerCount = $derived(
    (data ?? []).find((datum) => datum.value == null)?.count ?? null
  );

  let chartData = $derived(
    (data ?? [])
      .filter((datum) => datum.value != null)
      .map((datum) => {
        const targetInfo = targetLookup[datum.value];
        return {
          label: datum.value,
          count: datum.count,
          target: targetInfo?.target ?? null,
          total: targetInfo?.total ?? null,
          progress: targetInfo ? Math.min(datum.count / targetInfo.target, 1) : null
        };
      })
  );

  const BAR_HEIGHT = 36;
  const BAR_GAP = 12;
</script>

<div class="mt-4 px-8">
  <h2 class="my-4 font-sans text-2xl font-bold leading-[1.01]">
    {title}
  </h2>

  {#if noAnswerCount != null}
    <p class="mb-4 font-sans text-sm text-muted-foreground">
      <span class="font-medium text-foreground">{totalCount - noAnswerCount}</span> out of <span class="font-medium text-foreground">{totalCount}</span> {totalCount === 1 ? 'person' : 'people'} answered this question
    </p>
  {/if}

  {#if chartData.length > 0}
    <div style="height: {chartData.length * (BAR_HEIGHT + BAR_GAP) + BAR_GAP}px;">
      <LayerCake
        data={chartData}
        x={(d) => d.progress ?? 0}
        y="label"
        xDomain={[0, 1]}
        yScale={scaleBand().paddingInner(0.25)}
        padding={{ top: 0, right: 150, bottom: 0, left: 140 }}
      >
        <Svg>
          <DemographicBars />
        </Svg>
      </LayerCake>
    </div>
  {:else}
    <p class="text-muted-foreground">No data available</p>
  {/if}
</div>
