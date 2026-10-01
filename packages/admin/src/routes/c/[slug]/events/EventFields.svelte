<script lang="ts">
	import CharCount from '$lib/components/CharCount.svelte';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import * as ToggleGroup from '@civicos/shared/ui/toggle-group';
	import { Calendar, Check, Copy, MapPin, Monitor, Video } from '@lucide/svelte';
	import { earliestStart, formatWallDate } from '$lib/utils/event-time';
	import TimeSelect from './TimeSelect.svelte';
	import { BROWSER_TZ, type EventField, type EventForm, type MeetMode } from './event-form';

	type Props = {
		form: EventForm;
		/** The participant RSVP link, or null while the event does not exist yet. */
		rsvpLink: string | null;
		/** Grey out dates and times before now. */
		limitToFuture: boolean;
		oncommit?: (field: EventField) => void;
	};

	let { form = $bindable(), rsvpLink, limitToFuture, oncommit }: Props = $props();

	const TIMEZONES: string[] =
		typeof Intl.supportedValuesOf === 'function'
			? Intl.supportedValuesOf('timeZone')
			: [BROWSER_TZ];

	const meetModes = [
		{ value: 'in_person', label: 'In Person', icon: MapPin },
		{ value: 'civicos_online', label: 'CivicOS Online', icon: Video },
		{ value: 'external_online', label: 'Zoom / Other Online', icon: Monitor }
	] as const;

	let tzOpen = $state(false);
	let dateEl = $state<HTMLInputElement | null>(null);

	const earliest = $derived(earliestStart(form.time_zone, form.start_date));
	// Zoom / Other Online has nowhere to send people until a link is entered.
	const missingCustomLink = $derived(
		form.meet_mode === 'external_online' && !form.custom_event_link.trim()
	);

	function tzLabel(tz: string): string {
		return (
			new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' })
				.formatToParts(new Date())
				.find((p) => p.type === 'timeZoneName')?.value ?? tz
		);
	}

	function setMeetMode(next: MeetMode) {
		form.meet_mode = next;
		oncommit?.('meetMode');
	}

	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | null = null;
	function copyLink(link: string) {
		navigator.clipboard?.writeText(link);
		copied = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1500);
	}

	const LABEL = 'text-caption font-bold tracking-tight uppercase';
	const FIELD =
		'flex h-14 items-center gap-3 rounded-lg border border-input bg-background px-4 focus-within:border-ring';
</script>

<div class="space-y-8">
	<div>
		<input
			aria-label="Event name"
			bind:value={form.name}
			maxlength={TEXT_LIMITS.eventName}
			onblur={() => oncommit?.('name')}
			placeholder="Event name"
			class="w-full bg-transparent text-h3 font-bold outline-none placeholder:text-muted-foreground/60 md:text-h2"
		/>
		<CharCount count={form.name.length} limit={TEXT_LIMITS.eventName} />
	</div>

	<div class="border-t border-border"></div>

	<div class="space-y-3">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_auto]">
			<div class="space-y-2">
				<Label for="ev-date" class={LABEL}>Date</Label>
				<div class="relative">
					<button
						id="ev-date"
						type="button"
						onclick={() => dateEl?.showPicker?.()}
						class={`${FIELD} w-full cursor-pointer touch-manipulation text-left text-body-lg font-semibold transition-colors hover:border-ring`}
					>
						<Calendar class="size-5 shrink-0" />
						<span class={form.start_date ? '' : 'text-muted-foreground'}>
							{form.start_date ? formatWallDate(form.start_date) : 'Pick a date'}
						</span>
					</button>
					<!-- Holds the value and anchors the native calendar under the button; never typed into (#483). -->
					<input
						type="date"
						tabindex="-1"
						aria-hidden="true"
						bind:this={dateEl}
						bind:value={form.start_date}
						min={limitToFuture ? earliest.date : undefined}
						onchange={() => oncommit?.('times')}
						class="pointer-events-none absolute inset-0 opacity-0"
					/>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="ev-start" class={LABEL}>Start time</Label>
				<TimeSelect
					id="ev-start"
					label="Start time"
					bind:value={form.start_time}
					min={limitToFuture ? earliest.time : undefined}
					onpick={() => oncommit?.('times')}
					class="md:w-56"
				/>
			</div>
			<div class="space-y-2">
				<Label for="ev-end" class={LABEL}>End time</Label>
				<TimeSelect
					id="ev-end"
					label="End time"
					bind:value={form.end_time}
					onpick={() => oncommit?.('times')}
					class="md:w-56"
				/>
			</div>
		</div>

		<p class="text-body font-semibold italic">
			All times in {tzLabel(form.time_zone)}.
			<button
				type="button"
				onclick={() => (tzOpen = !tzOpen)}
				aria-expanded={tzOpen}
				class="cursor-pointer font-semibold text-primary italic transition-opacity hover:underline active:opacity-60"
			>
				Change time zone
			</button>
		</p>

		{#if tzOpen}
			<select
				aria-label="Time zone"
				bind:value={form.time_zone}
				onchange={() => oncommit?.('times')}
				class="h-12 w-full max-w-md rounded-lg border border-input bg-background px-4 text-body outline-none focus-visible:border-ring"
			>
				{#each TIMEZONES as tz (tz)}
					<option value={tz}>{tz}</option>
				{/each}
			</select>
		{/if}
	</div>

	<div class="border-t border-border"></div>

	<div class="space-y-3">
		<Label class={LABEL}>How will you meet?</Label>
		<ToggleGroup.Root
			type="single"
			value={form.meet_mode}
			onValueChange={(v) => v && setMeetMode(v as MeetMode)}
			aria-label="How will you meet?"
			class="grid w-full grid-cols-1 gap-5 rounded-none border-0 bg-transparent p-0 shadow-none md:grid-cols-3"
		>
			{#each meetModes as mode (mode.value)}
				{@const Icon = mode.icon}
				<ToggleGroup.Item
					value={mode.value}
					class="h-[76px] w-full justify-center rounded-lg border border-input bg-background text-body-lg font-semibold text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary data-[state=on]:shadow-none [&_svg]:size-5"
				>
					<Icon />
					{mode.label}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</div>

	{#if form.meet_mode === 'in_person'}
		<div class="space-y-3">
			<Label class={LABEL}>Location</Label>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Input
					bind:value={form.location.venue_name}
					onblur={() => oncommit?.('location')}
					placeholder="Venue name"
					class="h-14 bg-background px-4 text-body-lg"
				/>
				<Input
					bind:value={form.location.address_line_1}
					onblur={() => oncommit?.('location')}
					placeholder="Address line 1"
					class="h-14 bg-background px-4 text-body-lg"
				/>
				<Input
					bind:value={form.location.address_line_2}
					onblur={() => oncommit?.('location')}
					placeholder="Address line 2 (optional)"
					class="h-14 bg-background px-4 text-body-lg"
				/>
				<Input
					bind:value={form.location.city}
					onblur={() => oncommit?.('location')}
					placeholder="City"
					class="h-14 bg-background px-4 text-body-lg"
				/>
				<Input
					bind:value={form.location.state_province}
					onblur={() => oncommit?.('location')}
					placeholder="State / province"
					class="h-14 bg-background px-4 text-body-lg"
				/>
				<Input
					bind:value={form.location.postal_code}
					onblur={() => oncommit?.('location')}
					placeholder="Postal code"
					class="h-14 bg-background px-4 text-body-lg"
				/>
				<Input
					bind:value={form.location.country_code}
					onblur={() => oncommit?.('location')}
					placeholder="Country code (e.g. US)"
					class="h-14 bg-background px-4 text-body-lg"
				/>
			</div>
			<p class="text-body italic">
				All required address fields must be filled before location saves.
			</p>
		</div>
	{:else if form.meet_mode === 'civicos_online'}
		<div class="space-y-3">
			<Label class={LABEL}>Web address</Label>
			<div class="flex items-center gap-3 rounded-lg border border-input bg-muted/40 px-4 py-5">
				{#if rsvpLink}
					<div class="min-w-0 flex-1 truncate text-body-lg font-semibold">{rsvpLink}</div>
					<Button variant="outline" size="sm" onclick={() => copyLink(rsvpLink)}>
						{#if copied}
							<Check class="size-3.5" /> copied
						{:else}
							<Copy class="size-3.5" /> copy
						{/if}
					</Button>
				{:else}
					<div class="flex-1 text-body text-muted-foreground">
						{rsvpLink === null
							? 'The RSVP link appears here once the event is created.'
							: 'This Campaign has no public address yet.'}
					</div>
				{/if}
			</div>
			<p class="text-body italic">
				CivicOS hosts this one, so participants meet on the RSVP page. This link will only be sent
				to participants once they have registered.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			<Label for="ev-link" class={LABEL}>Web address</Label>
			<Input
				id="ev-link"
				type="url"
				required
				aria-invalid={missingCustomLink}
				bind:value={form.custom_event_link}
				onblur={() => oncommit?.('link')}
				placeholder="https://"
				class="h-[76px] bg-background px-4 text-body-lg font-semibold"
			/>
			{#if missingCustomLink}
				<p class="text-body text-destructive">
					Add the meeting link participants should join. Without it they have nowhere to go.
				</p>
			{/if}
			<p class="text-body italic">
				This link will only be sent to participants once they have registered.
			</p>
		</div>
	{/if}

	<div class="border-t border-border"></div>

	<div class="space-y-3">
		<Label for="ev-desc" class={LABEL}>Additional context</Label>
		<textarea
			id="ev-desc"
			bind:value={form.description}
			maxlength={TEXT_LIMITS.eventDescription}
			onblur={() => oncommit?.('description')}
			rows="5"
			placeholder="Description of the event..."
			class="w-full rounded-lg border border-input bg-background px-4 py-4 text-body-lg leading-relaxed outline-none focus-visible:border-ring"
		></textarea>
		<CharCount count={form.description.length} limit={TEXT_LIMITS.eventDescription} class="mt-1" />
	</div>

	<div class="border-t border-border"></div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="space-y-3">
			<Label for="ev-cap" class={LABEL}>Capacity</Label>
			<Input
				id="ev-cap"
				type="number"
				min="2"
				bind:value={form.capacity}
				onblur={() => oncommit?.('capacity')}
				placeholder="No limit"
				class="h-14 bg-background px-4 text-body-lg font-semibold"
			/>
		</div>
		<div class="space-y-3">
			<Label for="ev-sign" class={LABEL}>Signup mode</Label>
			<select
				id="ev-sign"
				bind:value={form.signup_mode}
				onchange={() => oncommit?.('signup')}
				class="h-14 w-full rounded-lg border border-input bg-background px-4 text-body-lg font-semibold outline-none focus-visible:border-ring"
			>
				<option value="open">Open</option>
				<option value="invite">Invite only</option>
			</select>
		</div>
	</div>
</div>
