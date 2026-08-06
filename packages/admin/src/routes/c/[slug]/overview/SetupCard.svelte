<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Section heading, e.g. "Co-Hosts". */
		title: string;
		/** Optional supporting line under the heading. */
		subtitle?: string;
		/** Optional right-aligned header slot (status badge, link, etc.). */
		action?: Snippet;
		/** Card body. */
		children: Snippet;
		class?: string;
	}

	let { title, subtitle, action, children, class: className }: Props = $props();
</script>

<!-- Matches the Analysis/Insights card idiom: rounded-[20px] + shadow-card, a
     display-font heading with an optional section-size subtitle. -->
<Card
	class="hover:border-muted-foreground/40 shadow-card rounded-[20px] transition-colors duration-200 {className ??
		''}"
>
	<header class="flex items-start justify-between gap-4 px-8 pt-8">
		<div class="min-w-0">
			<h2 class="font-display text-foreground text-display font-semibold">{title}</h2>
			{#if subtitle}
				<p class="text-foreground/70 text-section mt-2 font-medium">{subtitle}</p>
			{/if}
		</div>
		{#if action}
			<div class="shrink-0">{@render action()}</div>
		{/if}
	</header>

	<div class="px-8 pt-6 pb-8">
		{@render children()}
	</div>
</Card>
