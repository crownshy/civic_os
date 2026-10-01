<script lang="ts">
	import { colorSchemeCss } from '@civicos/shared/data/color-scheme';

	let { data, children } = $props();

	// Built as a string because Svelte compiles a literal `<style>` element as the
	// component's own stylesheet and never evaluates an expression inside it. Safe
	// under {@html}: every value comes from the shared constant, not from metadata.
	const schemeStyle = $derived(
		data.colorScheme ? `<style>${colorSchemeCss(data.colorScheme)}</style>` : ''
	);
</script>

<!-- In the head rather than on a wrapper, because dialogs portal to `document.body`. -->
<svelte:head>
	{#if schemeStyle}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html schemeStyle}
	{/if}
</svelte:head>

{@render children()}
