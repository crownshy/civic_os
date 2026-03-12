<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		children: import('svelte').Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div
	class={cn(
		'app-shell relative mx-auto h-dvh w-full max-w-[430px] overflow-x-hidden overflow-y-hidden bg-background shadow-none md:max-w-[768px] md:rounded-2xl md:shadow-2xl',
		className
	)}
>
	{@render children()}
</div>
