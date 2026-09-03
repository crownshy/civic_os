<script lang="ts">
	import type { GroupWithTally } from '../domain/types';

	let { tally }: { tally: GroupWithTally } = $props();

	// widths are shares of this group's own votes, so a thinly-voted group still
	// fills the bar rather than rendering as a sliver next to a busy one
	const total = $derived(Math.max(1, tally.n ?? 0));
	const parts = $derived(
		[
			{ cls: 'd', value: tally.d ?? 0 },
			{ cls: 'p', value: tally.p ?? 0 },
			{ cls: 'a', value: tally.a ?? 0 }
		].filter((part) => part.value > 0)
	);
</script>

<div class="bar">
	{#each parts as part (part.cls)}
		<i class={part.cls} style="flex:{part.value / total} 0 0"></i>
	{/each}
</div>
