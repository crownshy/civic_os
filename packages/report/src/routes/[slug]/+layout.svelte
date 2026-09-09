<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BloomReport from '$lib/BloomReport.svelte';
	import { THEME_BY_KEY } from '$lib/domain/bundled';
	import type { StepKey } from '$lib/domain/nav';
	import { setNavigate } from '$lib/navigation';

	let { children } = $props();

	/**
	 * Where each step lives. Route ids rather than paths, so `resolve` can
	 * type-check them and apply `base`; the same table read backwards is how a
	 * matched route becomes the step the report should show.
	 */
	const STEP_ROUTES = {
		title: '/[slug]',
		demogs: '/[slug]/demographics',
		groups: '/[slug]/groups',
		consensus: '/[slug]/consensus',
		themes: '/[slug]/themes'
	} as const satisfies Record<StepKey, string>;

	const THEME_ROUTE = '/[slug]/themes/[theme]';

	const STEP_BY_ROUTE = new Map<string, StepKey>(
		Object.entries(STEP_ROUTES).map(([step, id]) => [id, step as StepKey])
	);

	/** A single theme page reports its theme key; the report treats that as a step too. */
	const step = $derived(
		page.route.id === THEME_ROUTE
			? (page.params.theme ?? 'title')
			: (STEP_BY_ROUTE.get(page.route.id ?? '') ?? 'title')
	);

	function navigate(key: string) {
		const slug = page.params.slug ?? '';
		if (THEME_BY_KEY.has(key)) {
			return goto(resolve(THEME_ROUTE, { slug, theme: key }));
		}
		const route = STEP_ROUTES[key as StepKey];
		return goto(resolve(route ?? STEP_ROUTES.title, { slug }));
	}

	// the pages below call this rather than knowing any URLs of their own
	setNavigate(navigate);
</script>

<!--
	The report lives in the layout, not in the pages: SvelteKit keeps a layout
	mounted while only the child page changes, so navigating between steps does
	not tear down and rebuild the map, the theme grid, or the scroll position.
	The pages themselves are empty markers that declare a URL.
-->
<BloomReport {step}>
	{@render children()}
</BloomReport>
