<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant =
		'primary' | 'secondary' | 'destructive' | 'outline' | 'pill' | 'soft' | 'ghost' | 'gradient';
	type Size = 'xs' | 'sm' | 'md' | 'lg';

	interface Props extends Omit<HTMLButtonAttributes, 'class' | 'onclick' | 'disabled' | 'type'> {
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
		children,
		...restProps
	}: Props = $props();

	// `transition-all` rather than `transition-colors` so the press scale and the
	// shadow drop animate too. `active:duration-0` lands the pressed state on
	// touch-down; without it the tap is over before the 150ms fade finishes.
	const base =
		'inline-flex touch-manipulation items-center justify-center rounded-full font-mono font-medium transition-all select-none active:scale-[0.97] active:duration-0';

	// Every variant needs an `active:` state, not just a hover one: a phone never
	// enters hover, so a tap on a hover-only button gives no feedback at all until
	// the next screen paints. Filled variants also drop their shadow on press,
	// which reads as the button going down into the surface.
	const variants: Record<Variant, string> = {
		primary:
			'bg-primary text-primary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] hover:bg-primary/90 active:bg-primary/80 active:shadow-none',
		secondary:
			'bg-secondary text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] hover:bg-secondary/90 active:bg-secondary/80 active:shadow-none',
		destructive:
			'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
		pill: 'text-primary [background-color:color-mix(in_srgb,var(--primary)_20%,white)] hover:[background-color:color-mix(in_srgb,var(--primary)_30%,white)] active:[background-color:color-mix(in_srgb,var(--primary)_40%,white)]',
		soft: 'bg-secondary/10 text-secondary hover:bg-secondary/20 active:bg-secondary/30',
		ghost: 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white active:bg-white/20',
		gradient:
			'bg-white/10 shadow-[inset_2px_4px_4px_0px_rgba(0,0,0,0.20)] outline outline-2 outline-foreground/20 hover:bg-white/20 active:bg-white/25',
		outline:
			'bg-transparent text-secondary border-4 border-secondary hover:bg-secondary/10 active:bg-secondary/20'
	};

	const disabledVariants: Record<Variant, string> = {
		primary: 'opacity-50 bg-primary text-primary-foreground shadow-none',
		secondary: 'bg-black/10 text-white/40 shadow-none',
		destructive: 'opacity-50 bg-destructive text-destructive-foreground',
		pill: 'opacity-50',
		soft: 'opacity-50 bg-secondary/10 text-secondary',
		ghost: 'opacity-50',
		gradient: 'opacity-50',
		outline: 'opacity-50 bg-transparent text-secondary/50 border-4 border-secondary/50'
	};

	const sizes: Record<Size, string> = {
		xs: 'h-auto px-2 py-0.5 text-sm',
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
			disabled && 'cursor-not-allowed active:scale-100',
			className
		)
	);
</script>

{#if href && !disabled}
	<a {href} class={classes}>
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} {onclick} class={classes} {...restProps}>
		{@render children()}
	</button>
{/if}
