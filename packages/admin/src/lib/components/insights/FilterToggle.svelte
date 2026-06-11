<script lang="ts">
	/** A pill-shaped on/off toggle, e.g. "Exclude host statements". */
	interface Props {
		label: string;
		checked: boolean;
		onchange?: (next: boolean) => void;
	}

	let { label, checked = $bindable(false), onchange }: Props = $props();

	function toggle() {
		checked = !checked;
		onchange?.(checked);
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	onclick={toggle}
	class={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
		checked
			? 'bg-destructive/80 text-destructive-foreground'
			: 'bg-muted text-destructive'
	}`}
>
	<span>{label}</span>
	<span
		class={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${
			checked ? 'bg-destructive-foreground/40' : 'bg-destructive/30'
		}`}
	>
		<span
			class={`inline-block size-3 rounded-full transition-transform ${
				checked ? 'translate-x-2.5 bg-destructive-foreground' : 'translate-x-0.5 bg-destructive'
			}`}
		></span>
	</span>
</button>
