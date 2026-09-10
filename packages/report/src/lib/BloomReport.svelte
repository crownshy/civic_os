<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import { THEME_BY_KEY } from './domain/bundled';
	import { chromeFor } from './domain/page-chrome';
	import { setOpenDemographics, setOpenGroup, setOpenShare, setOpenStatement } from './navigation';
	import { closeAllModals, modals, openStatement as open } from './state.svelte';
	import DemographicsModal from './components/DemographicsModal.svelte';
	import GroupModal from './components/GroupModal.svelte';
	import PageBar from './components/PageBar.svelte';
	import ShareModal from './components/ShareModal.svelte';
	import StatementModal from './components/StatementModal.svelte';
	import TopBar from './components/TopBar.svelte';

	interface Props {
		/** a step key ('title', 'demogs', ...) or a theme key */
		step: string;
		/** the current route's page, rendered inside the report's own column */
		children?: Snippet;
	}

	let { step, children }: Props = $props();

	setOpenStatement((view, index) => open(view as never, index));
	setOpenGroup((key) => (modals.group = { key, page: 0 }));
	setOpenDemographics(() => (modals.demographics = { index: 0 }));
	setOpenShare(() => (modals.share = { copied: false }));

	onNavigate(closeAllModals);

	const theme = $derived(THEME_BY_KEY.get(step));
	const chrome = $derived(chromeFor(step, theme));
	const grid = $derived(chrome.grid ? 'var(--grid-bg)' : 'none');

	let barShown = $state(false);

	/**
	 * The page colour is set twice: inline on .shell, so the server-rendered
	 * page is already the right colour, and here on the root, so <body> (which
	 * is what shows in the desktop gutter) matches it too.
	 */
	$effect(() => {
		document.title = theme
			? `${theme.short} — Bloom`
			: 'Bloom — A Conversation on AI in Central Oregon';

		const root = document.documentElement.style;
		root.setProperty('--c', chrome.accent);
		root.setProperty('--page-bg', chrome.background);
		root.setProperty('--page-grid', grid);

		return () => {
			root.removeProperty('--c');
			root.removeProperty('--page-bg');
			root.removeProperty('--page-grid');
		};
	});

	// the browser chrome colour follows the open theme
	const themeColor = $derived(theme?.color ?? null);
</script>

<svelte:head>
	{#if themeColor}
		<meta name="theme-color" content={themeColor} />
	{/if}
</svelte:head>

<div
	class="shell"
	class:withTopBar={chrome.topBarText !== null}
	class:withBottomBar={barShown}
	class:fitViewport={step === 'demogs'}
	style:--page-bg={chrome.background}
	style:--page-grid={grid}
>
	{#if chrome.topBarText}
		<TopBar color={chrome.topBarText} />
	{/if}
	<PageBar {step} bind:shown={barShown} />
	{@render children?.()}
</div>

<StatementModal />
<GroupModal />
<DemographicsModal />
<ShareModal />
