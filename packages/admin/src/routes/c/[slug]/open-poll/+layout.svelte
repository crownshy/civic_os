<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();

	const subTabs = [
		{ label: 'Participants', href: '/participants' },
		{ label: 'Moderation', href: '/moderation' },
		{ label: 'Insights', href: '/insights' }
	];

	const openPollBase = $derived(`/c/${page.params.slug}/open-poll`);
	const activeSubTab = $derived(
		subTabs.find((t) => page.url.pathname.startsWith(openPollBase + t.href))?.href ?? ''
	);
</script>

<!-- Open Poll sub-tabs strip -->
<nav class="border-border bg-destructive/5 flex items-center gap-1.5 border-b px-5">
	{#each subTabs as tab}
		<a
			href={openPollBase + tab.href}
			class={`px-3.5 py-3.5 text-body font-medium ${
				activeSubTab === tab.href ? 'text-destructive' : 'text-foreground/70 hover:text-foreground'
			}`}
		>
			{tab.label}
		</a>
	{/each}
</nav>

<div class="flex-1 overflow-y-auto px-5 py-5">
	{@render children?.()}
</div>
