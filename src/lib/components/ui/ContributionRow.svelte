<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		text: string;
		meta: string;
		onDelete?: () => void;
		class?: string;
	}

	let { text, meta, onDelete, class: className }: Props = $props();
</script>

<div
	class={cn(
		'flex flex-col gap-1.5 border-b border-primary/20 px-7 py-2.5',
		className
	)}
>
	<p class="font-mono text-sm font-medium text-primary">{text}</p>
	<p class="font-mono text-xs font-medium opacity-70">
		<span class="text-primary">{meta}</span>
		{#if onDelete}
			<span class="text-primary"> | </span>
			<button onclick={onDelete} class="text-destructive uppercase">DELETE</button>
		{/if}
	</p>
</div>
