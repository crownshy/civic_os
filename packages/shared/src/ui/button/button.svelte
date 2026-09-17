<script lang="ts" module>
	import { cn, type WithElementRef } from '../../utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		// Pill-shaped buttons driven by semantic role tokens, no hardcoded hues,
		// so each app themes them via its own --primary / --destructive values.
		// `default` is the filled primary CTA; `secondary` is the subtle primary
		// tint (the paired "Cancel"); `destructive` is delete/reject.
		//
		// Every variant carries a pressed state as well as a hover one. Touch has no
		// hover, so without `active:` a tap gives no feedback until the next paint.
		// Neutral variants press to `foreground/10` rather than a darker `accent`,
		// which reads as a wash in both light and dark.
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 touch-manipulation items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-[3px] active:scale-[0.97] active:duration-0 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-xs active:shadow-none',
				destructive:
					'bg-destructive hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 dark:active:bg-destructive/75 text-white shadow-xs active:shadow-none',
				'destructive-outline':
					'border-destructive/60 text-destructive hover:bg-destructive/10 active:border-destructive active:bg-destructive/20 border bg-transparent shadow-xs active:shadow-none',
				outline:
					'bg-background hover:bg-accent hover:text-accent-foreground active:bg-foreground/10 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:active:bg-foreground/15 border shadow-xs active:shadow-none',
				secondary: 'bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30',
				ghost:
					'hover:bg-accent hover:text-accent-foreground active:bg-foreground/10 dark:hover:bg-accent/50 dark:active:bg-foreground/15',
				// A text link has no box to press, so it dims instead of scaling.
				link: 'text-primary underline-offset-4 hover:underline active:text-primary/70 active:scale-100'
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 px-6 has-[>svg]:px-4',
				icon: 'size-9',
				'icon-sm': 'size-8',
				'icon-lg': 'size-10'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
