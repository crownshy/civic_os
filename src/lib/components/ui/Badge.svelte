<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Variant = 'dark' | 'soft' | 'primary' | 'primary-soft';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		class?: string;
		children: Snippet;
	}

	let { variant = 'soft', size = 'md', class: className, children }: Props = $props();

	const variants: Record<Variant, string> = {
		dark: 'bg-primary-dark text-primary-foreground',
		soft: 'bg-secondary/10 text-foreground',
		primary: 'bg-primary text-primary-foreground',
		'primary-soft': 'bg-primary/10 text-primary'
	};

	const sizes: Record<Size, string> = {
		sm: 'px-1.5 py-px text-[10px] leading-4 rounded-[10px]',
		md: 'px-2.5 py-1 text-xs rounded-full',
		lg: 'px-3 py-2 text-sm rounded-full'
	};

	const classes = $derived(
		cn(
			'inline-flex items-center font-mono font-medium uppercase',
			variants[variant],
			sizes[size],
			className
		)
	);
</script>

<span class={classes}>
	{@render children()}
</span>
