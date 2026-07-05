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

<section class="font-ui flex flex-wrap items-end gap-x-16 gap-y-4">
	{#each stats as s (s.label)}
		<div>
			<div class="text-foreground text-body font-medium uppercase">
				{s.label}{#if s.action}
					(<button
						type="button"
						class="text-destructive cursor-pointer underline"
						onclick={s.action.onclick}>{s.action.label}</button
					>){/if}
			</div>
			<div class="text-foreground text-hero font-extrabold leading-none">
				{s.value}{#if s.accent}<span class="text-primary text-4xl font-extrabold">{s.accent}</span
					>{/if}
			</div>
		</div>
	{/each}
</section>
