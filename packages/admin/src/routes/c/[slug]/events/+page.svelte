<script lang="ts">
	import { ChevronRight, MapPin, Monitor } from '@lucide/svelte';
	import { page } from '$app/state';
	import { REGIONS } from '@civicos/shared/data/regions';
	import type { ConversationEvent } from '@civicos/shared/types';

	const region = $derived(REGIONS[page.params.slug ?? '']);

	// Mock RSVP totals + draft/past flags layered on top of regions data.
	// Phase 3 replaces with API-backed currentAttendance + published.
	const rsvpFor = (slug: string) => {
		// Deterministic-ish placeholder so each event has a number.
		const seed = slug.length * 7 + slug.charCodeAt(0);
		return { current: (seed * 3) % 90 + 5, capacity: ((seed * 5) % 80) + 30 };
	};

	const partitioned = $derived.by(() => {
		const now = Date.now();
		const events = (region?.events ?? []) as ConversationEvent[];
		const upcoming: ConversationEvent[] = [];
		const past: ConversationEvent[] = [];
		for (const e of events) {
			if (new Date(e.date).getTime() < now) past.push(e);
			else upcoming.push(e);
		}
		return { upcoming, past, drafts: [] as ConversationEvent[] };
	});

	const counts = $derived({
		upcoming: partitioned.upcoming.length,
		drafts: partitioned.drafts.length,
		past: partitioned.past.length
	});

	let activeFilter = $state<'upcoming' | 'drafts' | 'past'>('upcoming');
	let viewMode = $state<'list' | 'calendar'>('list');

	const visible = $derived(
		activeFilter === 'upcoming'
			? partitioned.upcoming
			: activeFilter === 'past'
				? partitioned.past
				: partitioned.drafts
	);

	function fmtWeekday(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
	}
	function fmtMonthDay(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="flex-1 space-y-3.5 overflow-y-auto px-5 py-5">
	<!-- Filters / view mode -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1.5">
			{#each [['upcoming', counts.upcoming], ['drafts', counts.drafts], ['past', counts.past]] as const as [label, n]}
				<button
					type="button"
					onclick={() => (activeFilter = label)}
					class={`rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs ${
						activeFilter === label
							? 'bg-destructive/10 text-foreground'
							: 'bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/15'
					}`}
				>
					{label} · {n}
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-2">
			{#each (['list', 'calendar'] as const) as mode}
				<button
					type="button"
					onclick={() => (viewMode = mode)}
					class={`rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs ${
						viewMode === mode ? 'bg-destructive/10' : 'bg-muted-foreground/10 hover:bg-muted-foreground/15'
					}`}
				>
					{mode}
				</button>
			{/each}
		</div>
	</div>

	{#if viewMode === 'calendar'}
		<div class="text-muted-foreground py-10 text-center text-sm italic">
			Calendar view — coming soon
		</div>
	{:else if visible.length === 0}
		<div class="text-muted-foreground py-10 text-center text-sm italic">
			No {activeFilter} events.
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each visible as event}
				{@const rsvp = rsvpFor(event.slug)}
				<a
					href={`/c/${region.slug}/events/${event.slug}`}
					class="bg-card shadow-card flex items-center gap-4 rounded-lg p-4 transition hover:translate-y-[-1px]"
				>
					<div class="w-16 text-center">
						<div class="text-muted-foreground text-xs tracking-wide">{fmtWeekday(event.date)}</div>
						<div class="text-lg font-bold leading-5">{fmtMonthDay(event.date)}</div>
					</div>
					<div class="border-border h-9 self-center border-l"></div>
					<div class="flex-1 space-y-1">
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold">{event.title}</span>
							{#if event.format === 'in-person'}
								<span
									class="bg-accent inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs"
								>
									<MapPin class="size-3" />in-person
								</span>
							{:else}
								<span
									class="bg-muted-foreground/10 text-muted-foreground inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs"
								>
									<Monitor class="size-3" />online
								</span>
							{/if}
							{#if activeFilter === 'past'}
								<span
									class="bg-destructive/10 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs"
								>
									past
								</span>
							{/if}
						</div>
						<div class="text-muted-foreground flex items-center gap-2.5 text-xs">
							<span>{event.time}{event.endTime ? `–${event.endTime}` : ''}</span>
							<span>·</span>
							<span>{event.venueName ?? event.location}{event.address ? ` · ${event.address}` : ''}</span>
						</div>
					</div>
					<div class="w-24 text-right">
						<div class="text-muted-foreground text-xs tracking-wide">RSVP'D</div>
						<div class="text-base font-bold">{rsvp.current} / {rsvp.capacity}</div>
					</div>
					<span
						class="bg-primary text-primary-foreground inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-xs"
					>
						open <ChevronRight class="size-3" />
					</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
