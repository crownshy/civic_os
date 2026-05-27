<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<div class={cn('flex h-48 items-center justify-center rounded-[10px] bg-primary', className)}>
	<span class="font-mono text-sm font-medium text-primary-foreground">MAP</span>
</div>
