<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { RichText } from '../domain/types';

	/**
	 * Report copy whose highlighted phrases are data rather than markup. The
	 * caller supplies the highlight snippet, so the emphasis is styled in the
	 * page that owns the look, and its scoped CSS still applies.
	 */
	type Props = { text: RichText; highlight: Snippet<[string]> };
	let { text, highlight }: Props = $props();
</script>

{#each text as part, i (i)}{#if typeof part === 'string'}{part}{:else}{@render highlight(
			part.highlight
		)}{/if}{/each}
