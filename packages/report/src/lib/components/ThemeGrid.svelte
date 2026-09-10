<script module lang="ts">
	// Remembered across mounts: leaving for a theme page unmounts this grid, and
	// coming back should land where you were rather than at the top. Only a
	// departure via a theme block arms it, so a fresh arrival still starts at 0.
	let rememberedScroll: number | null = null;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { THEMES } from '../domain/bundled';
	import { getNavigate } from '../navigation';
	import ThemeBlock from './ThemeBlock.svelte';

	const navigate = getNavigate();

	onMount(() => {
		if (rememberedScroll === null) return;
		scrollTo({ top: rememberedScroll, behavior: 'auto' });
		rememberedScroll = null;
	});

	function openTheme(key: string) {
		rememberedScroll = scrollY;
		navigate(key);
	}
</script>

<main class="themeGrid">
	<div class="masthead">
		<h1>What 400+ people had to say about AI in Central Oregon</h1>
		<p>
			Responses gathered in six listening sessions around the region and one open poll, sorted into
			seven themes. Each square below is one poll statement or one comment from a live session.
		</p>
	</div>

	<div class="legend label">
		<span><i></i> Poll statement</span>
		<span><i class="q"></i> Session quote</span>
	</div>

	<div class="blocks">
		{#each THEMES as theme, index (theme.key)}
			<ThemeBlock {theme} {index} onopen={() => openTheme(theme.key)} />
		{/each}
	</div>
</main>

<style>
	.themeGrid {
		display: block;
		color: var(--ink);
	}
	.themeGrid .masthead h1 {
		color: var(--theme-blue);
	}
	.themeGrid .masthead p {
		color: var(--ink);
	}
	.legend {
		padding: 24px 22px 18px;
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		color: color-mix(in srgb, var(--ink) 48%, transparent);
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
	.legend i {
		width: 11px;
		height: 11px;
		border-radius: 1.5px;
		background: color-mix(in srgb, var(--ink) 55%, transparent);
		flex: none;
	}
	.legend i.q {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ink) 55%, transparent);
	}
	.blocks {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 6px 22px 20px;
	}
</style>
