<script lang="ts">
	/** Pill-shaped selectable theme chip used by the Theme Explorer. */
	interface Props {
		label: string;
		selected: boolean;
		/**
		 * Colour scheme. `default` uses the admin `destructive`/`muted` tokens
		 * (the coral `#ee503b`); `brand` uses the terracotta brand accent
		 * (`--color-brand`, `#c96442`): a solid brand fill with white text when
		 * selected, and the subtle brand surface (`--color-brand-subtle`) with
		 * brand text when idle. See app.css for the token definitions.
		 */
		variant?: 'default' | 'brand';
		onclick?: () => void;
	}

	let { label, selected, variant = 'default', onclick }: Props = $props();

	const palette = {
		default: {
			on: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
			off: 'bg-muted text-destructive hover:bg-muted-foreground/15'
		},
		brand: {
			on: 'bg-brand text-brand-foreground hover:bg-brand/90',
			off: 'bg-brand-subtle text-brand hover:bg-brand-subtle-hover'
		}
	};
</script>

<button
	type="button"
	{onclick}
	class={`font-ui cursor-pointer rounded-[30px] px-3 py-2 text-lg font-medium leading-6 transition-all duration-150 hover:scale-[1.05] hover:shadow-sm active:scale-[0.96] ${
		selected ? palette[variant].on : palette[variant].off
	}`}
>
	{label}
</button>
