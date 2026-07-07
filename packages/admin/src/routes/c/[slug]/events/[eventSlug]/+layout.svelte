<script lang="ts">
	import { page } from "$app/state";
	import * as Popover from "@civicos/shared/ui/popover";
	import { ChevronDown } from "@lucide/svelte";

	let { data, children } = $props();

	const event = $derived(data.event);
	const events = $derived(data.events ?? []);

	const subTabs = [
		{ label: "Setup", href: "" },
		{ label: "Participants", href: "/registrations" },
		{ label: "Recordings & Analysis", href: "/recordings" },
	];

	const eventBase = $derived(
		`/c/${page.params.slug}/events/${page.params.eventSlug}`,
	);
	const eventsRoot = $derived(`/c/${page.params.slug}/events`);

	const activeSubTab = $derived(
		subTabs.find((t) =>
			t.href === ""
				? page.url.pathname === eventBase
				: page.url.pathname.startsWith(eventBase + t.href),
		)?.href ?? "",
	);

	// The sub-page segment currently open (e.g. "/recordings"), so switching events
	// keeps you on the same tab. Drops any deeper id (e.g. a recording id).
	const subSuffix = $derived.by(() => {
		const rest = page.url.pathname.slice(eventBase.length);
		const seg = rest.split("/")[1];
		return seg ? `/${seg}` : "";
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
			class="flex items-center gap-3 bg-primary px-4 py-4 text-body font-medium text-primary-foreground outline-none"
		>
			{event ? eventLabel(event) : "Select event"}
			<ChevronDown class="size-4" />
		</Popover.Trigger>
		<Popover.Content
			align="start"
			sideOffset={0}
			class="w-72 overflow-hidden rounded-xl border border-muted-foreground/20 p-1 shadow-lg"
		>
			{#each events as ev (ev.id)}
				{@const active = ev.id === page.params.eventSlug}
				<a
					href={`${eventsRoot}/${ev.id}${subSuffix}`}
					onclick={() => (switcherOpen = false)}
					class={`block truncate rounded-lg px-3 py-2 text-body font-medium ${active ? "text-primary" : "text-foreground hover:bg-muted"}`}
				>
					{eventLabel(ev)}
				</a>
			{/each}
		</Popover.Content>
	</Popover.Root>

	{#each subTabs as tab (tab.href)}
		<a
			href={eventBase + tab.href}
			class={`px-4 py-4 text-body font-medium ${
				activeSubTab === tab.href
					? "text-primary"
					: "text-foreground/70 hover:text-foreground"
			}`}
		>
			{tab.label}
		</a>
	{/each}
</nav>

{#if !event}
	<div class="p-8 text-muted-foreground">Event not found.</div>
{:else}
	<div class="flex min-h-0 flex-1 flex-col px-5 py-5">
		<div class="min-h-0 flex-1 overflow-y-auto">
			{@render children?.()}
		</div>
	</div>
{/if}
