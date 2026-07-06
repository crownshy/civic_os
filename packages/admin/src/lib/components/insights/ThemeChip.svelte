<script lang="ts">
	/** Pill-shaped selectable theme chip used by the Theme Explorer. */
	interface Props {
		label: string;
		selected: boolean;
		/**
		 * Colour scheme. `default` uses the admin `destructive`/`muted` tokens
		 * (the coral `#ee503b`); `brand` uses the exact Figma spec — terracotta
		 * `#C96442` fill with white text when selected, warm off-white `#FCF7F6`
		 * with `#C96442` text when idle.
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
			on: 'bg-[#C96442] text-white hover:bg-[#C96442]/90',
			off: 'bg-[#FCF7F6] text-[#C96442] hover:bg-[#F3E7E2]'
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
