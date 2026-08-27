<script lang="ts">
	import { page } from '$app/state';
	import * as Popover from '@civicos/shared/ui/popover';
	import { ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	let { data, children } = $props();

	const event = $derived(data.event);
	const events = $derived(data.events ?? []);

	const subTabs = [
		{ label: 'Setup', href: '', route: '/c/[slug]/events/[eventSlug]' },
		{
			label: 'Participants',
			href: '/registrations',
			route: '/c/[slug]/events/[eventSlug]/registrations'
		},
		{
			label: 'Recordings & Analysis',
			href: '/recordings',
			route: '/c/[slug]/events/[eventSlug]/recordings'
		}
	] as const;

	const campaignSlug = $derived(data.campaign.slug);
	const eventId = $derived(page.params.eventSlug ?? '');
	const eventBase = $derived(`/c/${campaignSlug}/events/${eventId}`);

	const activeSubTab = $derived(
		subTabs.find((t) =>
			t.href === ''
				? page.url.pathname === eventBase
				: page.url.pathname.startsWith(eventBase + t.href)
		)?.href ?? ''
	);

	// The sub-page segment currently open (e.g. "/recordings"), so switching events
	// keeps you on the same tab. Drops any deeper id (e.g. a recording id).
	const subSuffix = $derived.by(() => {
		const rest = page.url.pathname.slice(eventBase.length);
		const seg = rest.split('/')[1];
		return seg ? `/${seg}` : '';
	});

	function eventLabel(ev: { name: string; startTime: string }) {
		const d = new Date(ev.startTime);
		return `(${d.getMonth() + 1}/${d.getDate()}) ${ev.name}`;
	}

	let switcherOpen = $state(false);
</script>

<!-- Event switcher + sub-tabs -->
<nav class="flex items-stretch border-b border-foreground/30">
	<Popover.Root bind:open={switcherOpen}>
		<Popover.Trigger
			class="flex cursor-pointer items-center gap-3 bg-primary px-4 py-2.5 text-body font-medium text-primary-foreground outline-none"
		>
			{event ? eventLabel(event) : 'Select event'}
			<ChevronDown class="size-4" />
		</Popover.Trigger>
		<Popover.Content
			align="start"
			sideOffset={0}
			class="w-72 overflow-hidden rounded-xl border border-muted-foreground/20 p-1 shadow-lg"
		>
			{#each events as ev (ev.id)}
				{@const active = ev.id === page.params.eventSlug}
				<!-- The base is resolved; `subSuffix` is the sub-path carried over from the
				     current route so switching events keeps you on the same tab. -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href={resolve('/c/[slug]/events/[eventSlug]', { slug: campaignSlug, eventSlug: ev.id }) +
						subSuffix}
					onclick={() => (switcherOpen = false)}
					class={`block truncate rounded-lg px-3 py-2 text-body font-medium ${active ? 'text-primary' : 'text-foreground hover:bg-muted'}`}
				>
					{eventLabel(ev)}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/each}
		</Popover.Content>
	</Popover.Root>

	{#each subTabs as tab (tab.href)}
		<a
			href={resolve(tab.route, { slug: campaignSlug, eventSlug: eventId })}
			class={`cursor-pointer px-4 py-2.5 text-body font-medium ${
				activeSubTab === tab.href ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
			}`}
		>
			{tab.label}
		</a>
	{/each}
</nav>

{#if !event}
	<div class="p-8 text-muted-foreground">Event not found.</div>
{:else}
	<div class="flex min-h-0 flex-1 flex-col px-8 py-8">
		<div class="min-h-0 flex-1 overflow-y-auto">
			{@render children?.()}
		</div>
	</div>
{/if}
