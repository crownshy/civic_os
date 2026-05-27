<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		size?: 'xs' | 'sm' | 'md' | 'lg';
		variant?: 'primary' | 'white' | 'muted';
		class?: string;
		children: import('svelte').Snippet;
	}

	let { size = 'sm', variant = 'primary', class: className, children }: Props = $props();
</script>

<span
	class={cn(
		'font-mono font-medium uppercase',
		size === 'xs' && 'text-xs',
		size === 'sm' && 'text-sm',
		size === 'md' && 'text-lg',
		size === 'lg' && 'text-2xl',
		variant === 'primary' && 'text-primary',
		variant === 'white' && 'text-primary-foreground',
		variant === 'muted' && 'text-muted-foreground',
		className
	)}
>
	{@render children()}
</span>
