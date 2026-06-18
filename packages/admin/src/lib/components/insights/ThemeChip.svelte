<script lang="ts">
	/** Pill-shaped selectable theme chip used by the Theme Explorer. */
	interface Props {
		label: string;
		selected: boolean;
		onclick?: () => void;
	}

	let { label, selected, onclick }: Props = $props();
</script>

<button
	type="button"
	{onclick}
	class={`cursor-pointer rounded-full px-3 py-1.5 text-body font-medium transition-all duration-150 hover:scale-[1.05] hover:shadow-sm active:scale-[0.96] ${
		selected
			? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
			: 'bg-muted text-destructive hover:bg-muted-foreground/15'
	}`}
>
	{label}
</button>
