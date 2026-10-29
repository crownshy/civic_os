<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import { UmamiAnalytics } from '@lukulent/svelte-umami';
	import { session } from '$lib/services/session.svelte';

	let { children, data } = $props();

	// Reconcile the localStorage cache against the participant the server
	// resolved from the cookie. Browser only: `session` is a module singleton.
	if (browser) session.hydrate(data.participant, data.participantResolved);
</script>

<UmamiAnalytics
	websiteID="f233da81-a265-4980-ba3e-889b2a1ae120"
	srcURL="https://eu.umami.is/script.js"
/>

{@render children()}
<div style="display:none">
	{#each locales as locale (locale)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- paraglide builds the localized pathname -->
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
