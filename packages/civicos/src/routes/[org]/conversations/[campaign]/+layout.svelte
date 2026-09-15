<script lang="ts">
	import { brandCss, isEmptyBrand } from '@civicos/shared/data/brand';

	let { data, children } = $props();

	// The whole `<style>` element is built as a string, not written as markup.
	// Svelte compiles a real `<style>` element as the component's own stylesheet,
	// so `<style>{@html css}</style>` ships the literal text `{@html css}` to the
	// browser and the expression never runs.
	//
	// Emitted here rather than in `load`, on ADR 0005's reasoning: `brandCss`
	// re-validates every value before it writes a declaration, so a Brand that
	// reached the page some other way still cannot carry anything but a
	// variable. That is also what makes this `{@html}` safe: no value can hold a
	// `<`, so nothing can close the tag early.
	const brandStyle = $derived.by(() => {
		if (isEmptyBrand(data.brand)) return '';
		const css = brandCss(data.brand);

		return css ? `<style>${css}</style>` : '';
	});
</script>

<!--
	`:root:root`, in the head. Doubled because `theme.css` emits its own unlayered
	`:root` block *after* this one in the document, so equal specificity would
	lose on source order. Head rather than a wrapper element because dialogs and
	overlays portal to `document.body`.
-->
<svelte:head>
	{#if brandStyle}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html brandStyle}
	{/if}
</svelte:head>

{@render children()}
