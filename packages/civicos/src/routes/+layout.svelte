<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import { UmamiAnalytics } from '@lukulent/svelte-umami';
	import { session } from '$lib/services/session.svelte';

	let { children, data } = $props();

	// The session writes through the API client built in `load` rather than
	// making its own, and reconciles its localStorage cache against the
	// participant the server resolved from the cookie. Browser only: `session`
	// is a module singleton.
	if (browser) {
		session.setApi(data.api);
		session.hydrate(data.participant, data.participantResolved);
	}
</script>

<UmamiAnalytics
	websiteID="f233da81-a265-4980-ba3e-889b2a1ae120"
	srcURL="https://eu.umami.is/script.js"
/>

{@render children()}
<div style="display:none">
	{#each locales as locale (locale)}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
