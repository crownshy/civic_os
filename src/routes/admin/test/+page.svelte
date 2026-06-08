<script lang="ts">
	import { ChevronRight, MapPin, Monitor } from '@lucide/svelte';
	import { REGIONS } from '$lib/config/regions';

	// Spike data: Utah events from hardcoded regions. Real API arrives in Phase 3.
	const events = REGIONS.utah.events.slice(0, 4);

	function fmtWeekday(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
	}
	function fmtMonthDay(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const counts = { upcoming: 2, drafts: 1, past: 1 };
	const rsvps: Record<string, { current: number; capacity: number; draft?: boolean; past?: boolean }> = {
		'may-02-springville': { current: 78, capacity: 120 },
		'may-05-online': { current: 34, capacity: 80 },
		'may-07-online': { current: 12, capacity: 40, draft: true },
		'may-09-kearns': { current: 24, capacity: 30, past: true }
	};

	const tabs = ['Overview', 'Open Poll', 'Participants', 'Events', 'Learnings'];
	let activeTab = $state('Events');
	let viewMode = $state<'list' | 'calendar'>('list');
	let activeFilter = $state<'upcoming' | 'drafts' | 'past'>('upcoming');
</script>

<!-- Top bar -->
<header class="border-border flex h-28 items-center justify-between border-b px-7 py-5">
	<h1 class="text-4xl font-bold leading-none">AI &amp; Our Communities</h1>
	<div class="flex items-center gap-1">
		<span class="bg-primary text-primary-foreground px-1.5 py-0.5 text-sm font-semibold leading-5"
			>LIVE</span
		>
		<a
			href="https://oregon.bloomproject.us/ai"
			class="bg-destructive/10 text-destructive px-1.5 py-0.5 text-sm font-medium leading-5 underline"
		>
			oregon.bloomproject.us/ai ↗
		</a>
	</div>
</header>

<!-- Tabs -->
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

<!-- Content -->
<div class="flex-1 space-y-3.5 overflow-y-auto px-5 py-5">
	<!-- Filter / view-mode row -->
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

	<!-- Event cards -->
	<div class="space-y-2.5">
		{#each events as event}
			{@const meta = rsvps[event.slug]}
			<div class="bg-card shadow-card flex items-center gap-4 rounded-lg p-4">
				<!-- Date block -->
				<div class="w-16 text-center">
					<div class="text-muted-foreground text-xs tracking-wide">{fmtWeekday(event.date)}</div>
					<div class="text-lg font-bold leading-5">{fmtMonthDay(event.date)}</div>
				</div>

				<div class="border-border h-9 self-center border-l"></div>

				<!-- Title + meta -->
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
						{#if meta?.draft}
							<span
								class="bg-destructive/10 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs"
							>
								draft
							</span>
						{/if}
						{#if meta?.past}
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

				<!-- RSVP block -->
				{#if meta}
					<div class="w-24 text-right">
						<div class="text-muted-foreground text-xs tracking-wide">RSVP'D</div>
						<div class="text-base font-bold">{meta.current} / {meta.capacity}</div>
					</div>
				{/if}

				<!-- Open pill (dark) -->
				<button
					type="button"
					class="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-xs"
				>
					open <ChevronRight class="size-3" />
				</button>
			</div>
		{/each}
	</div>

	<p class="text-muted-foreground pt-6 text-xs italic">
		Phase 0 spike — verifies look-and-feel against wireframe. Data comes from
		<code>regions.ts</code>; real API wiring lands in Phase 3.
	</p>
</div>
