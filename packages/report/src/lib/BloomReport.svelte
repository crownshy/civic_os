<script lang="ts">
	import { THEME_BY_KEY } from './domain/bundled';
	import { setOpenDemographics, setOpenGroup, setOpenStatement } from './navigation';
	import { closeStatement, modals, openStatement as open } from './state.svelte';
	import DemographicsModal from './components/DemographicsModal.svelte';
	import GroupModal from './components/GroupModal.svelte';
	import PageBar from './components/PageBar.svelte';
	import StatementModal from './components/StatementModal.svelte';

	interface Props {
		/** a step key ('title', 'demogs', ...) or a theme key */
		step: string;
		/** the current route's page, rendered inside the report's own column */
		children?: import('svelte').Snippet;
	}

	let { step, children }: Props = $props();

	setOpenStatement((view, index) => open(view as never, index));
	setOpenGroup((key) => (modals.group = key));
	setOpenDemographics(() => (modals.demographics = true));

	const theme = $derived(THEME_BY_KEY.get(step));

	/**
	 * The document-level consequences of being on a step: the title, the accent
	 * the desktop gutter and the modals read, and the body classes app.css keys
	 * its gutter rules off. Navigating also dismisses anything left open.
	 */
	$effect(() => {
		void step;
		closeStatement();
		modals.group = null;
		modals.demographics = false;
	});

	$effect(() => {
		document.title = theme
			? `${theme.short} — Bloom`
			: 'Bloom — A Conversation on AI in Central Oregon';

		const accent = theme ? theme.color : step === 'consensus' ? 'var(--agree)' : 'var(--home)';
		document.documentElement.style.setProperty('--c', accent);

		document.body.classList.toggle('groups-page', step === 'groups');
		document.body.classList.toggle('theme-page', Boolean(theme));

		return () => {
			document.documentElement.style.removeProperty('--c');
			document.body.classList.remove('groups-page', 'theme-page');
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

<div class="shell">
	<PageBar {step} />
	{@render children?.()}
</div>

<StatementModal />
<GroupModal />
<DemographicsModal />
