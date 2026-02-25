<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		variant?: 'filled' | 'outline' | 'ghost' | 'filled-white';
		size?: 'sm' | 'md' | 'lg';
		fullWidth?: boolean;
		disabled?: boolean;
		class?: string;
		onclick?: () => void;
		children: import('svelte').Snippet;
	}

	let {
		variant = 'filled',
		size = 'md',
		fullWidth = false,
		disabled = false,
		class: className,
		onclick,
		children
	}: Props = $props();
</script>

<button
	{disabled}
	{onclick}
	class={cn(
		'rounded-full font-mono font-medium uppercase transition-colors',
		size === 'sm' && 'h-10 px-4 text-sm',
		size === 'md' && 'h-14 px-6 text-lg',
		size === 'lg' && 'h-16 px-8 text-lg',
		variant === 'filled' && 'bg-primary text-primary-foreground border-[3px] border-primary',
		variant === 'filled-white' && 'bg-card text-primary border-[3px] border-primary',
		variant === 'outline' && 'bg-transparent text-primary-foreground border-[3px] border-primary-foreground',
		variant === 'ghost' && 'bg-transparent text-primary-foreground border-[3px] border-primary-foreground',
		fullWidth && 'w-full',
		disabled && 'opacity-50 cursor-not-allowed',
		className
	)}
>
	{@render children()}
</button>
