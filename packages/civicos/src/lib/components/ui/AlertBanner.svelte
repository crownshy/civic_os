<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		message: string;
		class?: string;
	}

	let { message, class: className }: Props = $props();
</script>

<!-- role="alert" so a screen reader announces it the moment it appears. -->
<div
	role="alert"
	class={cn('flex items-center gap-3 rounded-[10px] bg-destructive px-4 py-3', className)}
>
	<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground">
		<span class="font-mono text-lg font-medium text-destructive">!</span>
	</div>
	<p class="font-sans text-base leading-5 font-medium text-primary-foreground">{message}</p>
</div>
