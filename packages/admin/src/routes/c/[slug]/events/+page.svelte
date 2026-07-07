<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { ChevronRight, Plus, X } from '@lucide/svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const region = $derived(data.region);
	const api = $derived(data.api);

	let showForm = $state(false);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const TIMEZONES: string[] =
		typeof Intl.supportedValuesOf === 'function'
			? Intl.supportedValuesOf('timeZone')
			: [BROWSER_TZ];

	let form = $state({
		name: '',
		description: '',
		start_date: '',
		start_time: '',
		end_time: '',
		capacity: '' as string,
		signup_mode: 'open' as 'open' | 'invite',
		time_zone: BROWSER_TZ
	});

	function resetForm() {
		form = {
			name: '',
			description: '',
			start_date: '',
			start_time: '',
			end_time: '',
			capacity: '',
			signup_mode: 'open',
			time_zone: BROWSER_TZ
		};
		formError = null;
	}

	// Convert a wall-clock date+time interpreted in `tz` to a UTC ISO instant.
	function zonedToISO(date: string, time: string, tz: string): string {
		const ms = Date.parse(`${date}T${time}:00Z`); // wall-clock as if UTC
		const parts = Object.fromEntries(
			new Intl.DateTimeFormat('en-US', {
				timeZone: tz,
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			})
				.formatToParts(new Date(ms))
				.map((p) => [p.type, p.value])
		);
		const tzAsMs = Date.UTC(
			Number(parts.year),
			Number(parts.month) - 1,
			Number(parts.day),
			parts.hour === '24' ? 0 : Number(parts.hour),
			Number(parts.minute),
			Number(parts.second)
		);
		const offset = tzAsMs - ms;
		return new Date(ms - offset).toISOString();
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		if (creating) return;
		formError = null;

		const { name, description, start_date, start_time, end_time, capacity, signup_mode, time_zone } = form;
		if (!name.trim() || !description.trim() || !start_date || !start_time || !end_time) {
			formError = 'Fill all required fields.';
			return;
		}
		if (end_time <= start_time) {
			formError = 'End time must be after start time.';
			return;
		}

		const startISO = zonedToISO(start_date, start_time, time_zone);
		const endISO = zonedToISO(start_date, end_time, time_zone);

		const body: Record<string, unknown> = {
			name: name.trim(),
			description: description.trim(),
			start_time: startISO,
			end_time: endISO,
			signup_mode,
			default_time_zone: time_zone
		};
		const cap = Number(capacity);
		if (Number.isFinite(cap) && cap > 0) body.capacity = Math.floor(cap);

		creating = true;
		try {
			await api.CreateEvent(body, {
				params: { conversation_id: region.conversationId }
			});
			await invalidate('events:list');
			showForm = false;
			resetForm();
		} catch (err) {
			console.error('CreateEvent failed', err);
			formError = 'Failed to create event.';
		} finally {
			creating = false;
		}
	}

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

<div class="flex-1 space-y-3.5 overflow-y-auto px-4 py-5 sm:px-5">
	<div class="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
		<div class="flex flex-wrap items-center gap-1.5">
			{#each [['upcoming', counts.upcoming], ['drafts', counts.drafts], ['past', counts.past]] as const as [label, n] (label)}
				<button
					type="button"
					onclick={() => (activeFilter = label)}
					class={`cursor-pointer rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-caption transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
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
					class={`cursor-pointer rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-caption transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
						viewMode === mode
							? 'bg-primary/10 shadow-sm'
							: 'bg-muted-foreground/10 hover:bg-muted-foreground/20'
					}`}
				>
					{mode}
				</button>
			{/each}
			<button
				type="button"
				onclick={() => (showForm = !showForm)}
				class="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-caption"
			>
				<Plus class="size-3" /> new event
			</button>
		</div>
	</div>

	{#if showForm}
		<form
			onsubmit={submitForm}
			class="bg-card border-border space-y-3.5 rounded-lg border p-4 shadow-sm"
		>
			<div class="flex items-start justify-between">
				<div>
					<h3 class="text-body font-bold">New event</h3>
					<p class="text-muted-foreground text-caption">
						Creates a draft event in this conversation.
					</p>
				</div>
				<button
					type="button"
					onclick={() => {
						showForm = false;
						resetForm();
					}}
					class="text-muted-foreground hover:text-foreground"
					aria-label="Close"
				>
					<X class="size-4" />
				</button>
			</div>

			<div class="space-y-1">
				<label class="text-muted-foreground text-caption tracking-tight" for="ev-name">NAME</label>
				<input
					id="ev-name"
					type="text"
					bind:value={form.name}
					required
					class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
					placeholder="Community listening session"
				/>
			</div>

			<div class="space-y-1">
				<label class="text-muted-foreground text-caption tracking-tight" for="ev-desc">DESCRIPTION</label>
				<textarea
					id="ev-desc"
					bind:value={form.description}
					required
					rows="3"
					class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
					placeholder="What's this gathering about?"
				></textarea>
			</div>

			<div class="flex flex-wrap gap-3">
				<div class="min-w-[160px] flex-1 space-y-1">
					<label class="text-muted-foreground text-caption tracking-tight" for="ev-date">DATE</label>
					<input
						id="ev-date"
						type="date"
						bind:value={form.start_date}
						required
						class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
					/>
				</div>
				<div class="min-w-[120px] flex-1 space-y-1">
					<label class="text-muted-foreground text-caption tracking-tight" for="ev-start">START</label>
					<input
						id="ev-start"
						type="time"
						bind:value={form.start_time}
						required
						class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
					/>
				</div>
				<div class="min-w-[120px] flex-1 space-y-1">
					<label class="text-muted-foreground text-caption tracking-tight" for="ev-end">END</label>
					<input
						id="ev-end"
						type="time"
						bind:value={form.end_time}
						required
						class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
					/>
				</div>
			</div>

			<div class="flex flex-wrap gap-3">
				<div class="min-w-[140px] flex-1 space-y-1">
					<label class="text-muted-foreground text-caption tracking-tight" for="ev-cap">CAPACITY</label>
					<input
						id="ev-cap"
						type="number"
						min="2"
						bind:value={form.capacity}
						class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
						placeholder="(optional)"
					/>
				</div>
				<div class="min-w-[160px] flex-1 space-y-1">
					<label class="text-muted-foreground text-caption tracking-tight" for="ev-sign">SIGNUP MODE</label>
					<select
						id="ev-sign"
						bind:value={form.signup_mode}
						class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
					>
						<option value="open">open</option>
						<option value="invite">invite only</option>
					</select>
				</div>
			</div>

			<div class="space-y-1">
				<label class="text-muted-foreground text-caption tracking-tight" for="ev-tz">TIME ZONE</label>
				<select
					id="ev-tz"
					bind:value={form.time_zone}
					class="bg-muted/30 border-foreground/20 w-full rounded-lg border px-3 py-2 text-body outline-none"
				>
					{#each TIMEZONES as tz (tz)}
						<option value={tz}>{tz}</option>
					{/each}
				</select>
				<p class="text-muted-foreground text-caption">
					Start/end times are interpreted in this zone. Defaults to your browser ({BROWSER_TZ}).
				</p>
			</div>

			{#if formError}
				<p class="text-destructive text-caption">{formError}</p>
			{/if}

			<div class="flex justify-end gap-2 pt-1">
				<button
					type="button"
					onclick={() => {
						showForm = false;
						resetForm();
					}}
					class="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-caption"
				>
					cancel
				</button>
				<button
					type="submit"
					disabled={creating}
					class="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-caption disabled:opacity-50"
				>
					{creating ? 'creating…' : 'create event'}
				</button>
			</div>
		</form>
	{/if}

	{#if viewMode === 'calendar'}
		<div class="text-muted-foreground py-10 text-center text-body italic">
			Calendar view — coming soon
		</div>
	{:else if visible.length === 0}
		<div class="text-muted-foreground py-10 text-center text-body italic">
			No {activeFilter} events.
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each visible as event (event.id)}
				<a
					href={`/c/${region.slug}/events/${event.id}`}
					class="group block"
				>
					<Card
						class="hover:border-primary/40 group-hover:bg-card group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200"
					>
						<div
							class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 bg-card p-4 sm:flex sm:items-center sm:gap-4"
						>
							<div class="flex items-baseline gap-1.5 sm:block sm:w-16 sm:shrink-0 sm:text-center">
								<div class="text-muted-foreground text-caption tracking-wide">
									{fmtWeekday(event.startTime)}
								</div>
								<div
									class="text-body leading-5 font-bold transition-colors group-hover:text-primary"
								>
									{fmtMonthDay(event.startTime)}
								</div>
							</div>
							<div class="border-border hidden h-9 self-center border-l sm:block"></div>
							<div class="col-span-2 min-w-0 space-y-1 sm:col-auto sm:flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="text-body font-bold transition-colors group-hover:text-primary"
									>
										{event.name}
									</span>
									{#if activeFilter === 'past'}
										<span
											class="bg-primary/10 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-caption"
										>
											past
										</span>
									{/if}
								</div>
								<div
									class="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption"
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
									<div class="text-muted-foreground text-caption tracking-wide">RSVP'D</div>
									<div class="text-body font-bold">
										{event.currentAttendance ?? 0}{event.capacity
											? ` / ${event.capacity}`
											: ''}
									</div>
								</div>
								<span
									class="bg-primary text-primary-foreground inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-caption transition-all group-hover:gap-1.5 sm:hidden"
								>
									open <ChevronRight class="size-3 transition-transform group-hover:translate-x-0.5" />
								</span>
							</div>
							<span
								class="bg-primary text-primary-foreground group-hover:bg-primary/90 hidden items-center gap-0.5 rounded-full px-3 py-1.5 text-caption transition-all group-hover:gap-1.5 sm:inline-flex"
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
