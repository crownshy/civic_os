<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		border?: boolean;
		children: import('svelte').Snippet;
	}

	let { class: className, border = true, children }: Props = $props();
</script>

<div
	class={cn(
		'app-shell relative mx-auto h-dvh w-full max-w-[860px] overflow-x-hidden overflow-y-hidden bg-background',
		border && 'border-x border-x-shell-border/50',
		className
	)}
>
	{@render children()}
</div>
