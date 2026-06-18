<script lang="ts">
	type Stat = {
		label: string;
		value: string | number;
		accent?: string;
	};

	let { stats }: { stats: Stat[] } = $props();
</script>

<section class="flex flex-wrap items-end gap-x-12 gap-y-4">
	{#each stats as s (s.label)}
		<div>
			<div class="text-foreground/70 text-label font-semibold uppercase tracking-wide">
				{s.label}
			</div>
			<div class="text-foreground text-stat font-extrabold">
				{s.value}{#if s.accent}<span class="text-foreground/50">{s.accent}</span>{/if}
			</div>
		</div>
	{/each}
</section>
