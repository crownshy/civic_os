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
		<div class="eyebrow label">Bloom Project · COCAP · Central Oregon</div>
		<h1>What 400+ people had to say about AI in Central Oregon</h1>
		<p>
			Six listening sessions and one open poll, sorted into eight themes. Each square below is one
			statement or one thing somebody said out loud.
		</p>
	</div>

	{#each THEMES as theme, index (theme.key)}
		<ThemeBlock {theme} {index} onopen={() => openTheme(theme.key)} />
	{/each}

	<div class="legend label">
		<span><i></i> Poll statement</span>
		<span><i class="q"></i> Session quote</span>
	</div>
</main>

<style>
	.themeGrid {
		display: block;
	}
	/* the hairline between adjacent blocks: the sibling relationship only exists
	   here, in the {#each}, so :global reaches across the component boundary */
	.themeGrid :global(.theme-block + .theme-block) {
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
	}
	.legend {
		padding: 20px 22px 46px;
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		color: rgba(255, 255, 255, 0.42);
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
		background: rgba(255, 255, 255, 0.6);
		flex: none;
	}
	.legend i.q {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.6);
	}
</style>
