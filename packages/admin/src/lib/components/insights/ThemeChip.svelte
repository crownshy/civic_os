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
	class={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
		selected ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-destructive'
	}`}
>
	{label}
</button>
