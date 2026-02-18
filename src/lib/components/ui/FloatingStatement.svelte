<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		text: string;
		class?: string;
	}

	let { text, class: className }: Props = $props();
</script>

<div
	class={cn(
		'flex h-16 items-center gap-3 rounded-full border-[3px] border-primary bg-background px-4',
		className
	)}
>
	<span class="h-9 w-9 shrink-0 rounded-full bg-primary"></span>
	<span class="truncate font-mono text-lg font-medium text-primary">{text}</span>
</div>
