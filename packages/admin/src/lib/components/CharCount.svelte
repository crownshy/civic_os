<script lang="ts">
	import { cn } from '@civicos/shared/utils';

	interface Props {
		count: number;
		limit: number;
		class?: string;
	}

	let { count, limit, class: className }: Props = $props();

	const over = $derived(count > limit);
</script>

<!-- Shown from the first keystroke so the limit is known before it is hit, not
     only after a paste was cut short at it. -->
<p
	class={cn(
		'text-right text-caption text-muted-foreground tabular-nums',
		count === limit && 'font-medium text-foreground',
		over && 'font-medium text-destructive',
		className
	)}
>
	{count.toLocaleString()} / {limit.toLocaleString()}
	{#if over}<span class="sr-only">characters, over the limit</span>{/if}
</p>
