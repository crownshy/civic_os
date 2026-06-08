<script lang="ts">
	import { page } from '$app/state';
	import { MapPin, Monitor } from '@lucide/svelte';
	import { REGIONS } from '@civicos/shared/data/regions';
	import type { ConversationEvent } from '@civicos/shared/types';

	let { children } = $props();

	const region = $derived(REGIONS[page.params.slug ?? '']);
	const event = $derived(region?.events.find((e: ConversationEvent) => e.slug === page.params.eventSlug));

	const subTabs = [
		{ label: 'Setup', href: '' },
		{ label: 'Agenda', href: '/agenda' },
		{ label: 'Registrations', href: '/registrations' },
		{ label: 'Insights', href: '/insights' }
	];

	const eventBase = $derived(`/c/${page.params.slug}/events/${page.params.eventSlug}`);
	const activeSubTab = $derived(
		subTabs.find((t) =>
			t.href === '' ? page.url.pathname === eventBase : page.url.pathname.startsWith(eventBase + t.href)
		)?.href ?? ''
	);

	function fmtDateLine(iso: string) {
		const d = new Date(iso);
		return d
			.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })
			.toUpperCase()
			.replace(',', '');
	}
	function fmtDay(iso: string) {
		return new Date(iso).getDate();
	}

	const rsvpFor = (slug: string) => {
		const seed = slug.length * 7 + slug.charCodeAt(0);
		return { current: (seed * 3) % 90 + 5, capacity: ((seed * 5) % 80) + 30 };
	};
	const rsvp = $derived(event ? rsvpFor(event.slug) : null);
</script>

<!-- Event sub-tabs strip -->
<nav
	class="border-border bg-destructive/5 flex items-center gap-1.5 border-b px-5"
>
	{#each subTabs as tab}
		<a
			href={eventBase + tab.href}
			class={`px-3.5 py-3.5 text-sm font-medium ${
				activeSubTab === tab.href ? 'text-destructive' : 'text-foreground/70 hover:text-foreground'
			}`}
		>
			{tab.label}
		</a>
	{/each}
</nav>

{#if !event}
	<div class="text-muted-foreground p-8">Event not found.</div>
{:else}
	<div class="flex-1 overflow-y-auto px-5 py-5">
		<!-- Event header card -->
		<div class="bg-card shadow-card flex items-center gap-3.5 rounded-lg p-4 mb-4">
			<div class="w-14 text-center">
				<div class="text-muted-foreground text-[9.8px]">{fmtDateLine(event.date)}</div>
				<div class="text-xl font-bold leading-5">{fmtDay(event.date)}</div>
			</div>
			<div class="border-border h-9 border-l"></div>
			<div class="flex-1">
				<div class="text-base font-bold">{event.title}</div>
				<div class="text-muted-foreground flex items-center gap-2 text-xs">
					<span>{event.time}{event.endTime ? ` – ${event.endTime}` : ''}</span>
					<span>·</span>
					<span>{event.venueName ?? event.location}</span>
					<span>·</span>
					{#if event.format === 'in-person'}
						<span
							class="bg-accent text-foreground inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-2.5 py-1 text-xs"
						>
							<MapPin class="size-3" />in-person
						</span>
					{:else}
						<span
							class="bg-muted-foreground/10 text-muted-foreground inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-2.5 py-1 text-xs"
						>
							<Monitor class="size-3" />online
						</span>
					{/if}
				</div>
			</div>
			<div class="text-muted-foreground text-xs">{rsvp!.current} / {rsvp!.capacity} rsvp'd</div>
			<button
				type="button"
				class="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs"
				onclick={() =>
					navigator.clipboard?.writeText(
						`civicos.app/c/${page.params.slug}/e/${event.slug}`
					)}
			>
				copy rsvp link
			</button>
		</div>

		{@render children?.()}
	</div>
{/if}
