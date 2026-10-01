<script lang="ts">
	import { Button } from '@civicos/shared/ui/button';
	import { ChevronRight, Plus } from '@lucide/svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';

	let { data }: { data: PageData } = $props();

	const campaign = $derived(data.campaign);

	type ApiEvent = (typeof data.events)[number];

	const partitioned = $derived.by(() => {
		const now = Date.now();
		const upcoming: ApiEvent[] = [];
		const past: ApiEvent[] = [];
		for (const e of data.events) {
			const t = new Date(e.endTime ?? e.startTime).getTime();
			if (t < now) past.push(e);
			else upcoming.push(e);
		}
		return { upcoming, past, drafts: [] as ApiEvent[] };
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
	function fmtTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<div class="flex-1 space-y-3.5 overflow-y-auto px-8 py-8">
	<div class="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
		<div class="flex flex-wrap items-center gap-1.5">
			{#each [['upcoming', counts.upcoming], ['drafts', counts.drafts], ['past', counts.past]] as const as [label, n] (label)}
				<button
					type="button"
					onclick={() => (activeFilter = label)}
					class={`cursor-pointer rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl px-3 py-1.5 text-caption transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
						activeFilter === label
							? 'bg-primary/10 text-foreground shadow-sm'
							: 'bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20'
					}`}
				>
					{label} · {n}
				</button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#each ['list', 'calendar'] as const as mode (mode)}
				<button
					type="button"
					onclick={() => (viewMode = mode)}
					class={`cursor-pointer rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl px-3 py-1.5 text-caption transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
						viewMode === mode
							? 'bg-primary/10 shadow-sm'
							: 'bg-muted-foreground/10 hover:bg-muted-foreground/20'
					}`}
				>
					{mode}
				</button>
			{/each}
			<Button size="sm" href={resolve('/c/[slug]/events/new', { slug: campaign.slug })}>
				<Plus class="size-3" /> new event
			</Button>
		</div>
	</div>

	{#if viewMode === 'calendar'}
		<div class="py-10 text-center text-body text-muted-foreground italic">
			Calendar view, coming soon
		</div>
	{:else if visible.length === 0}
		<div class="py-10 text-center text-body text-muted-foreground italic">
			No {activeFilter} events.
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each visible as event (event.id)}
				<a
					href={resolve('/c/[slug]/events/[eventSlug]', {
						slug: campaign.slug,
						eventSlug: event.id
					})}
					class="group block"
				>
					<Card
						class="transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-card group-hover:shadow-md hover:border-primary/40"
					>
						<div
							class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 bg-card p-4 sm:flex sm:items-center sm:gap-4"
						>
							<div class="flex items-baseline gap-1.5 sm:block sm:w-16 sm:shrink-0 sm:text-center">
								<div class="text-caption tracking-wide text-muted-foreground">
									{fmtWeekday(event.startTime)}
								</div>
								<div
									class="text-body leading-5 font-bold transition-colors group-hover:text-primary"
								>
									{fmtMonthDay(event.startTime)}
								</div>
							</div>
							<div class="hidden h-9 self-center border-l border-border sm:block"></div>
							<div class="col-span-2 min-w-0 space-y-1 sm:col-auto sm:flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-body font-bold transition-colors group-hover:text-primary">
										{event.name}
									</span>
									{#if activeFilter === 'past'}
										<span
											class="rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-primary/10 px-3 py-1.5 text-caption"
										>
											past
										</span>
									{/if}
								</div>
								<div
									class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption text-muted-foreground"
								>
									<span
										>{fmtTime(event.startTime)}{event.endTime
											? `–${fmtTime(event.endTime)}`
											: ''}</span
									>
								</div>
							</div>
							<div
								class="col-span-2 flex items-center justify-between gap-3 sm:col-auto sm:block sm:w-24 sm:text-right"
							>
								<div class="flex items-baseline gap-1.5 sm:block">
									<div class="text-caption tracking-wide text-muted-foreground">RSVP'D</div>
									<div class="text-body font-bold">
										{event.currentAttendance ?? 0}{event.capacity ? ` / ${event.capacity}` : ''}
									</div>
								</div>
								<span
									class="inline-flex items-center gap-0.5 rounded-full bg-primary px-3 py-1.5 text-caption text-primary-foreground transition-all group-hover:gap-1.5 sm:hidden"
								>
									open <ChevronRight
										class="size-3 transition-transform group-hover:translate-x-0.5"
									/>
								</span>
							</div>
							<span
								class="hidden items-center gap-0.5 rounded-full bg-primary px-3 py-1.5 text-caption text-primary-foreground transition-all group-hover:gap-1.5 group-hover:bg-primary/90 sm:inline-flex"
							>
								open
								<ChevronRight class="size-3 transition-transform group-hover:translate-x-0.5" />
							</span>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
