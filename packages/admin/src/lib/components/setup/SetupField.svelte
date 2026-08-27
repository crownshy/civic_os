<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Mono-style caption above the value, e.g. "KEY QUESTION". */
		label: string;
		children: Snippet;
		class?: string;
	}

	let { label, children, class: className }: Props = $props();
</script>

<div class="min-w-0 space-y-1.5 {className ?? ''}">
	<div class="font-ui text-caption font-semibold tracking-tight text-muted-foreground uppercase">
		{label}
	</div>
	{@render children()}
</div>
