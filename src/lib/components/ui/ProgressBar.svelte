<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		percentage: number;
		label?: string;
		variant?: 'on-primary' | 'on-white';
		class?: string;
	}

	let {
		percentage,
		label,
		variant = 'on-white',
		class: className
	}: Props = $props();

	const isPrimary = $derived(variant === 'on-primary');
</script>

<div class={cn('flex flex-col gap-1', className)}>
	{#if label}
		<span
			class={cn(
				'font-mono text-xs font-medium',
				isPrimary ? 'text-primary-foreground/70' : 'text-primary/70'
			)}
		>
			{label}
		</span>
	{/if}
	<div
		class={cn(
			'h-1.5 rounded-xl',
			isPrimary ? 'bg-primary-foreground' : 'bg-primary'
		)}
		style="width: {Math.min(percentage, 100)}%"
	></div>
</div>
