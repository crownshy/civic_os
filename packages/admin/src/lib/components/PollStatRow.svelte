<script lang="ts">
	type Stat = {
		label: string;
		value: string | number;
		/** Trailing delta, e.g. " (+26)", rendered in the primary/green accent. */
		accent?: string;
		/** Optional inline action rendered as "(LABEL)" link after the label. */
		action?: { label: string; onclick: () => void };
	};

	let { stats }: { stats: Stat[] } = $props();
</script>

<section class="flex flex-wrap items-end gap-x-16 gap-y-4 font-ui">
	{#each stats as s (s.label)}
		<div>
			<div class="text-body font-medium text-foreground uppercase">
				{s.label}{#if s.action}
					(<button
						type="button"
						class="cursor-pointer text-primary underline"
						onclick={s.action.onclick}>{s.action.label}</button
					>){/if}
			</div>
			<div class="text-hero leading-none font-extrabold text-foreground">
				{s.value}{#if s.accent}<span class="text-4xl font-extrabold text-success">{s.accent}</span
					>{/if}
			</div>
		</div>
	{/each}
</section>
