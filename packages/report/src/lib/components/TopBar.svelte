<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { color }: { color: string } = $props();

	const home = $derived(resolve('/[slug]', { slug: page.params.slug ?? '' }));
</script>

<header class="topBar" style:color>
	<a class="brand" href={home} aria-label="Home">
		<svg class="house" viewBox="0 0 24 24" aria-hidden="true"
			><path
				d="M3 11 12 3l9 8M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
		<span class="wordmark">AI &amp; Central Oregon</span>
	</a>
	<a class="link" href="https://cocap.us/ai" target="_blank" rel="noopener">
		Learn more at COCAP.US
		<svg viewBox="0 0 16 16" aria-hidden="true"
			><path
				d="M4.5 11.5 11.5 4.5M5.5 4.5H11.5V10.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
	</a>
</header>

<style>
	/* a solid fill in the page's own colour, so content scrolling under it
	   never shows through */
	.topBar {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		z-index: 45;
		width: 100%;
		max-width: 600px;
		height: var(--topbar-h);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 0 16px;
		background: var(--page-bg);
		border-bottom: 1px solid color-mix(in srgb, currentColor 22%, transparent);
	}
	.brand,
	.link {
		display: inline-flex;
		align-items: center;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: inherit;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}
	.link {
		gap: 6px;
	}
	.house {
		width: 19px;
		height: 19px;
		flex: none;
		stroke: currentColor;
		stroke-width: 2;
		fill: none;
	}
	.wordmark {
		display: none;
		color: color-mix(in srgb, currentColor 66%, transparent);
	}
	.link svg {
		width: 12px;
		height: 12px;
		flex: none;
		stroke: currentColor;
		stroke-width: 1.8;
		fill: none;
	}
	@media (hover: hover) {
		.brand:hover,
		.link:hover {
			opacity: 0.62;
		}
	}
	@media (min-width: 660px) {
		.topBar {
			max-width: 800px;
			padding: 0 24px;
		}
		.house {
			display: none;
		}
		.wordmark {
			display: inline;
		}
		.wordmark,
		.link {
			font-size: 14px;
			letter-spacing: 0.09em;
		}
	}
</style>
