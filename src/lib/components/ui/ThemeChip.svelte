<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		label: string;
		class?: string;
	}

	let { label, class: className }: Props = $props();
</script>

<div
	class={cn(
		'flex h-14 items-center justify-center rounded-[10px] bg-primary px-4',
		className
	)}
>
	<span class="text-center font-mono text-sm font-medium text-primary-foreground uppercase">
		{label}
	</span>
</div>
