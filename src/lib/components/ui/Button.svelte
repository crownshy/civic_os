<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'destructive' | 'pill' | 'ghost' | 'gradient';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		fullWidth?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'lg',
		fullWidth = false,
		disabled = false,
		type = 'button',
		href,
		onclick,
		class: className,
		children
	}: Props = $props();

	const base = 'inline-flex items-center justify-center rounded-full font-mono font-medium transition-colors';

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-primary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]',
		secondary: 'bg-black/30 text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]',
		destructive: 'text-destructive [background-color:color-mix(in_srgb,var(--destructive)_20%,white)]',
		pill: 'text-primary [background-color:color-mix(in_srgb,var(--primary)_20%,white)]',
		ghost: 'bg-transparent text-white/70',
		gradient: 'bg-white/10 shadow-[inset_2px_4px_4px_0px_rgba(0,0,0,0.20)] outline outline-2 outline-foreground/20',
		outline: 'bg-white/20 text-white/70 border-3 border-foreground'
	};

	const disabledVariants: Record<Variant, string> = {
		primary: 'bg-white/20 text-white/70 shadow-none',
		secondary: 'bg-black/10 text-white/40 shadow-none',
		destructive: 'opacity-50',
		pill: 'opacity-50',
		ghost: 'opacity-50',
		gradient: 'opacity-50',
		outline: 'opacity-50 bg-white/20 text-white/70 border-3 border-foreground'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-auto px-3 py-1.5 text-base',
		md: 'h-12 px-6 text-base',
		lg: 'h-14 px-2 py-2 text-lg'
	};

	const classes = $derived(
		cn(
			base,
			disabled ? disabledVariants[variant] : variants[variant],
			sizes[size],
			fullWidth && 'w-full',
			disabled && 'cursor-not-allowed',
			className
		)
	);
</script>

{#if href && !disabled}
	<a {href} class={classes}>
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} {onclick} class={classes}>
		{@render children()}
	</button>
{/if}
