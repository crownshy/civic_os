<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		message: string;
		class?: string;
	}

	let { message, class: className }: Props = $props();
</script>

<div class={cn('flex items-center gap-4 rounded-[10px] bg-destructive px-4 py-4', className)}>
	<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground">
		<span class="font-mono text-lg font-medium text-destructive">!</span>
	</div>
	<p class="font-mono text-xs font-medium text-primary-foreground">{message}</p>
</div>
