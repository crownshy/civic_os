<script lang="ts">
	import { ChevronRight, MapPin, Monitor } from '@lucide/svelte';

	// Phase 1 placeholder data — real API arrives in Phase 3.
	// Shape intentionally minimal (subset of @civicos/shared Event type).
	type SpikeEvent = {
		id: string;
		title: string;
		date: string;
		time: string;
		endTime?: string;
		venueName?: string;
		address?: string;
		format: 'in-person' | 'online';
		rsvp?: { current: number; capacity: number };
		draft?: boolean;
		past?: boolean;
	};

	const events: SpikeEvent[] = [
		{
			id: '1',
			title: 'Town Hall · School District 4',
			date: '2026-05-24T18:00:00-06:00',
			time: '6:00pm',
			endTime: '8:00pm',
			venueName: 'Lincoln HS Auditorium',
			address: '1200 Main St',
			format: 'in-person',
			rsvp: { current: 78, capacity: 120 }
		},
		{
			id: '2',
			title: 'Online Listening Session',
			date: '2026-06-02T19:00:00-06:00',
			time: '7:00pm',
			endTime: '8:00pm',
			venueName: 'Jitsi link · auto-records',
			format: 'online',
			rsvp: { current: 34, capacity: 80 }
		},
		{
			id: '3',
			title: 'Library Pop-up · Eastside',
			date: '2026-06-14T10:00:00-06:00',
			time: '10am',
			endTime: '2pm',
			venueName: 'Eastside Branch Library',
			format: 'in-person',
			rsvp: { current: 12, capacity: 40 },
			draft: true
		},
		{
			id: '4',
			title: 'Closing Reflection Circle',
			date: '2026-04-30T18:30:00-06:00',
			time: '6:30pm',
			venueName: 'Bloom Studio · 4 Vine St',
			format: 'in-person',
			rsvp: { current: 24, capacity: 30 },
			past: true
		}
	];

	function fmtWeekday(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
	}
	function fmtMonthDay(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const counts = { upcoming: 2, drafts: 1, past: 1 };
	const tabs = ['Overview', 'Open Poll', 'Participants', 'Events', 'Learnings'];
	let activeTab = $state('Events');
	let viewMode = $state<'list' | 'calendar'>('list');
	let activeFilter = $state<'upcoming' | 'drafts' | 'past'>('upcoming');
</script>

<header class="border-border flex h-28 items-center justify-between border-b px-7 py-5">
	<h1 class="text-4xl font-bold leading-none">AI &amp; Our Communities</h1>
	<div class="flex items-center gap-1">
		<span class="bg-primary text-primary-foreground px-1.5 py-0.5 text-sm font-semibold leading-5">
			LIVE
		</span>
		<a
			href="https://oregon.bloomproject.us/ai"
			class="bg-destructive/10 text-destructive px-1.5 py-0.5 text-sm font-medium leading-5 underline"
		>
			oregon.bloomproject.us/ai ↗
		</a>
	</div>
</header>

<nav class="border-border flex items-center border-b px-5">
	{#each tabs as tab}
		<button
			type="button"
			onclick={() => (activeTab = tab)}
			class={`relative h-11 px-2.5 text-sm font-medium ${
				activeTab === tab ? 'text-foreground border-destructive border-b-2' : 'text-foreground/50'
			}`}
		>
			{tab}
		</button>
	{/each}
</nav>

<div class="flex-1 space-y-3.5 overflow-y-auto px-5 py-5">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1.5">
			{#each [['upcoming', counts.upcoming], ['drafts', counts.drafts], ['past', counts.past]] as const as [label, n]}
				<button
					type="button"
					onclick={() => (activeFilter = label)}
					class={`rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs ${
						activeFilter === label
							? 'bg-destructive/10 text-foreground'
							: 'bg-muted-foreground/10 text-foreground'
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
						viewMode === mode ? 'bg-destructive/10' : 'bg-muted-foreground/10'
					}`}
				>
					{mode}
				</button>
			{/each}
		</div>
	</div>

	<div class="space-y-2.5">
		{#each events as event}
			<div class="bg-card shadow-card flex items-center gap-4 rounded-lg p-4">
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
						{#if event.draft}
							<span
								class="bg-destructive/10 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs"
							>
								draft
							</span>
						{/if}
						{#if event.past}
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
						<span>{event.venueName}{event.address ? ` · ${event.address}` : ''}</span>
					</div>
				</div>
				{#if event.rsvp}
					<div class="w-24 text-right">
						<div class="text-muted-foreground text-xs tracking-wide">RSVP'D</div>
						<div class="text-base font-bold">{event.rsvp.current} / {event.rsvp.capacity}</div>
					</div>
				{/if}
				<button
					type="button"
					class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-xs"
				>
					open <ChevronRight class="size-3" />
				</button>
			</div>
		{/each}
	</div>

	<p class="text-muted-foreground pt-6 text-xs italic">
		@civicos/admin — Phase 1 monorepo scaffold. Real events from API land in Phase 3.
	</p>
</div>
