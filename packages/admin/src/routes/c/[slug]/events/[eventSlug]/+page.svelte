<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import * as ToggleGroup from '@civicos/shared/ui/toggle-group';
	import { Calendar, Check, Clock, Copy, MapPin, Monitor, Trash2, Video } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const event = $derived(data.event);
	const campaign = $derived(data.campaign);
	const api = $derived(data.api);

	const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const TIMEZONES: string[] =
		typeof Intl.supportedValuesOf === 'function'
			? Intl.supportedValuesOf('timeZone')
			: [BROWSER_TZ];

	type LocationForm = {
		venue_name: string;
		address_line_1: string;
		address_line_2: string;
		city: string;
		state_province: string;
		postal_code: string;
		country_code: string;
	};

	/** The API has two formats; `online` splits by whether a custom link is set. */
	type MeetMode = 'in_person' | 'civicos_online' | 'external_online';

	type Form = {
		name: string;
		description: string;
		meet_mode: MeetMode;
		custom_event_link: string;
		start_date: string;
		start_time: string;
		end_time: string;
		capacity: string;
		signup_mode: 'open' | 'invite';
		time_zone: string;
		location: LocationForm;
	};

	const emptyLocation = (): LocationForm => ({
		venue_name: '',
		address_line_1: '',
		address_line_2: '',
		city: '',
		state_province: '',
		postal_code: '',
		country_code: ''
	});

	function tzPartsAt(ms: number, tz: string) {
		return Object.fromEntries(
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
	}

	function isoToWallClock(iso: string, tz: string): { date: string; time: string } {
		const ms = Date.parse(iso);
		const p = tzPartsAt(ms, tz);
		const hour = p.hour === '24' ? '00' : p.hour;
		return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}` };
	}

	function zonedToISO(date: string, time: string, tz: string): string {
		const ms = Date.parse(`${date}T${time}:00Z`);
		const p = tzPartsAt(ms, tz);
		const tzAsMs = Date.UTC(
			Number(p.year),
			Number(p.month) - 1,
			Number(p.day),
			p.hour === '24' ? 0 : Number(p.hour),
			Number(p.minute),
			Number(p.second)
		);
		const offset = tzAsMs - ms;
		return new Date(ms - offset).toISOString();
	}

	function tzLabel(tz: string): string {
		return (
			new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' })
				.formatToParts(new Date())
				.find((p) => p.type === 'timeZoneName')?.value ?? tz
		);
	}

	function meetModeOf(e: NonNullable<typeof event>): MeetMode {
		if (e.format === 'in_person') return 'in_person';
		return e.customEventLink ? 'external_online' : 'civicos_online';
	}

	function buildForm(e: typeof event): Form {
		if (!e) {
			return {
				name: '',
				description: '',
				meet_mode: 'in_person',
				custom_event_link: '',
				start_date: '',
				start_time: '',
				end_time: '',
				capacity: '',
				signup_mode: 'open',
				time_zone: BROWSER_TZ,
				location: emptyLocation()
			};
		}
		const tz = BROWSER_TZ;
		const start = isoToWallClock(e.startTime, tz);
		const end = isoToWallClock(e.endTime, tz);
		const loc = e.location ?? null;
		return {
			name: e.name ?? '',
			description: e.description ?? '',
			meet_mode: meetModeOf(e),
			custom_event_link: e.customEventLink ?? '',
			start_date: start.date,
			start_time: start.time,
			end_time: end.time,
			capacity: e.capacity != null ? String(e.capacity) : '',
			signup_mode: (e.signupMode as Form['signup_mode']) ?? 'open',
			time_zone: tz,
			location: {
				venue_name: loc?.venue_name ?? '',
				address_line_1: loc?.address_line_1 ?? '',
				address_line_2: loc?.address_line_2 ?? '',
				city: loc?.city ?? '',
				state_province: loc?.state_province ?? '',
				postal_code: loc?.postal_code ?? '',
				country_code: loc?.country_code ?? ''
			}
		};
	}

	let form = $state<Form>(buildForm(null));
	let loaded = false;
	let saving = $state(false);
	let error = $state<string | null>(null);
	let savedTick = $state(0);
	let deleting = $state(false);
	let deleteOpen = $state(false);
	let tzOpen = $state(false);

	let dateEl = $state<HTMLInputElement | null>(null);
	let startEl = $state<HTMLInputElement | null>(null);
	let endEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (loaded || !event) return;
		form = buildForm(event);
		loaded = true;
	});

	const isInPerson = $derived(form.meet_mode === 'in_person');
	const rsvpLink = $derived(event ? `civicos.app/c/${page.params.slug}/e/${event.id}` : '');
	// CivicOS Online meets on the RSVP page; Zoom / Other Online has nowhere to send
	// people until a custom link is entered.
	const missingCustomLink = $derived(
		form.meet_mode === 'external_online' && !form.custom_event_link.trim()
	);

	const meetModes = [
		{ value: 'in_person', label: 'In Person', icon: MapPin },
		{ value: 'civicos_online', label: 'CivicOS Online', icon: Video },
		{ value: 'external_online', label: 'Zoom / Other Online', icon: Monitor }
	] as const;

	type Patch = Record<string, unknown>;

	async function save(patch: Patch) {
		if (!event) return;
		saving = true;
		error = null;
		try {
			await api.UpdateEvent(patch, {
				params: { conversation_id: campaign.id, event_id: event.id }
			});
			await invalidate(`events:detail:${event.id}`);
			savedTick++;
		} catch (e) {
			console.error('UpdateEvent failed', e);
			error = 'Save failed.';
		} finally {
			saving = false;
		}
	}

	function setMeetMode(next: MeetMode) {
		form.meet_mode = next;
		const patch: Patch = { format: next === 'in_person' ? 'in_person' : 'online' };
		// Only the third mode carries a custom link; the others fall back to the RSVP page.
		if (next !== 'external_online') patch.custom_event_link = null;
		save(patch);
	}

	function saveCustomLink() {
		const link = form.custom_event_link.trim();
		if (link === (event?.customEventLink ?? '')) return;
		save({ custom_event_link: link || null });
	}

	function locationPatch(): LocationForm | null {
		const l = form.location;
		const required = [
			l.venue_name,
			l.address_line_1,
			l.city,
			l.state_province,
			l.postal_code,
			l.country_code
		];
		if (required.some((v) => !v.trim())) return null;
		return l;
	}

	function saveTimes() {
		if (!form.start_date || !form.start_time || !form.end_time) return;
		const start_time = zonedToISO(form.start_date, form.start_time, form.time_zone);
		const end_time = zonedToISO(form.start_date, form.end_time, form.time_zone);
		save({ start_time, end_time, default_time_zone: form.time_zone });
	}

	function saveLocation() {
		const loc = locationPatch();
		if (!loc) return;
		save({ location: loc });
	}

	function saveCapacity() {
		const n = Number(form.capacity);
		save({ capacity: Number.isFinite(n) && n > 0 ? Math.floor(n) : null });
	}

	async function doDelete() {
		if (!event || deleting) return;
		deleting = true;
		try {
			await api.DeleteEvent(undefined, {
				params: { conversation_id: campaign.id, event_id: event.id }
			});
			deleteOpen = false;
			// The events layout declares `events:list` and is a shared ancestor of this
			// route, so it survives the navigation and would still list the deleted event.
			await goto(resolve(`/c/${campaign.slug}/events`), { invalidate: ['events:list'] });
		} catch (e) {
			console.error('DeleteEvent failed', e);
			error = 'Delete failed.';
			deleting = false;
		}
	}

	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | null = null;
	function copyLink(link: string) {
		if (!link) return;
		navigator.clipboard?.writeText(link);
		copied = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1500);
	}

	const LABEL = 'text-caption font-bold tracking-tight uppercase';
	const FIELD =
		'flex h-14 items-center gap-3 rounded-lg border border-input bg-background px-4 focus-within:border-ring';
	// The lucide glyph replaces the native picker button, so the input keeps none of its own.
	const NATIVE =
		'w-full bg-transparent text-body-lg font-semibold outline-none [&::-webkit-calendar-picker-indicator]:hidden';
</script>

{#if event}
	<div class="space-y-8">
		<div class="flex items-center justify-end gap-3 text-caption">
			{#if saving}
				<span class="text-muted-foreground">saving…</span>
			{:else if savedTick > 0 && !error}
				{#key savedTick}
					<span class="inline-flex items-center gap-1 text-success">
						<Check class="size-3.5" /> saved
					</span>
				{/key}
			{/if}
			{#if error}
				<span class="text-destructive">{error}</span>
			{/if}
		</div>

		<input
			aria-label="Event name"
			bind:value={form.name}
			onblur={() => form.name.trim() !== event.name && save({ name: form.name.trim() })}
			class="w-full bg-transparent text-h3 font-bold outline-none md:text-h2"
		/>

		<div class="border-t border-border"></div>

		<div class="space-y-3">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_auto]">
				<div class="space-y-2">
					<Label for="ev-date" class={LABEL}>Date</Label>
					<div class={FIELD}>
						<button
							type="button"
							aria-label="Open date picker"
							onclick={() => dateEl?.showPicker?.()}
							class="cursor-pointer text-foreground"
						>
							<Calendar class="size-5" />
						</button>
						<input
							id="ev-date"
							type="date"
							bind:this={dateEl}
							bind:value={form.start_date}
							onblur={saveTimes}
							class={NATIVE}
						/>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="ev-start" class={LABEL}>Start time</Label>
					<div class={`${FIELD} md:w-56`}>
						<button
							type="button"
							aria-label="Open start time picker"
							onclick={() => startEl?.showPicker?.()}
							class="cursor-pointer text-foreground"
						>
							<Clock class="size-5" />
						</button>
						<input
							id="ev-start"
							type="time"
							bind:this={startEl}
							bind:value={form.start_time}
							onblur={saveTimes}
							class={NATIVE}
						/>
					</div>
				</div>
				<div class="space-y-2">
					<Label for="ev-end" class={LABEL}>End time</Label>
					<div class={`${FIELD} md:w-56`}>
						<button
							type="button"
							aria-label="Open end time picker"
							onclick={() => endEl?.showPicker?.()}
							class="cursor-pointer text-foreground"
						>
							<Clock class="size-5" />
						</button>
						<input
							id="ev-end"
							type="time"
							bind:this={endEl}
							bind:value={form.end_time}
							onblur={saveTimes}
							class={NATIVE}
						/>
					</div>
				</div>
			</div>

			<p class="text-body font-semibold italic">
				All times in {tzLabel(form.time_zone)}.
				<button
					type="button"
					onclick={() => (tzOpen = !tzOpen)}
					aria-expanded={tzOpen}
					class="cursor-pointer font-semibold text-primary italic hover:underline"
				>
					Change time zone
				</button>
			</p>

			{#if tzOpen}
				<select
					aria-label="Time zone"
					bind:value={form.time_zone}
					onchange={saveTimes}
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

		{#if isInPerson}
			<div class="space-y-3">
				<Label class={LABEL}>Location</Label>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Input
						bind:value={form.location.venue_name}
						onblur={saveLocation}
						placeholder="Venue name"
						class="h-14 bg-background px-4 text-body-lg"
					/>
					<Input
						bind:value={form.location.address_line_1}
						onblur={saveLocation}
						placeholder="Address line 1"
						class="h-14 bg-background px-4 text-body-lg"
					/>
					<Input
						bind:value={form.location.address_line_2}
						onblur={saveLocation}
						placeholder="Address line 2 (optional)"
						class="h-14 bg-background px-4 text-body-lg"
					/>
					<Input
						bind:value={form.location.city}
						onblur={saveLocation}
						placeholder="City"
						class="h-14 bg-background px-4 text-body-lg"
					/>
					<Input
						bind:value={form.location.state_province}
						onblur={saveLocation}
						placeholder="State / province"
						class="h-14 bg-background px-4 text-body-lg"
					/>
					<Input
						bind:value={form.location.postal_code}
						onblur={saveLocation}
						placeholder="Postal code"
						class="h-14 bg-background px-4 text-body-lg"
					/>
					<Input
						bind:value={form.location.country_code}
						onblur={saveLocation}
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
					<div class="min-w-0 flex-1 truncate text-body-lg font-semibold">{rsvpLink}</div>
					<Button variant="outline" size="sm" onclick={() => copyLink(rsvpLink)}>
						{#if copied}
							<Check class="size-3.5" /> copied
						{:else}
							<Copy class="size-3.5" /> copy
						{/if}
					</Button>
				</div>
				<p class="text-body italic">
					CivicOS hosts this one, so participants meet on the RSVP page. This link will only be sent
					to participants once they have registered.
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				<Label for="ev-link" class={LABEL}>Web address</Label>
				<div class="flex items-center gap-3">
					<Input
						id="ev-link"
						type="url"
						required
						aria-invalid={missingCustomLink}
						bind:value={form.custom_event_link}
						onblur={saveCustomLink}
						placeholder="https://"
						class="h-[76px] bg-background px-4 text-body-lg font-semibold"
					/>
				</div>

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
				onblur={() =>
					form.description.trim() !== event.description &&
					save({ description: form.description.trim() })}
				rows="5"
				placeholder="Description of the event..."
				class="w-full rounded-lg border border-input bg-background px-4 py-4 text-body-lg leading-relaxed outline-none focus-visible:border-ring"
			></textarea>
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
					onblur={saveCapacity}
					class="h-14 bg-background px-4 text-body-lg font-semibold"
				/>
			</div>
			<div class="space-y-3">
				<Label for="ev-sign" class={LABEL}>Signup mode</Label>
				<select
					id="ev-sign"
					bind:value={form.signup_mode}
					onchange={() => save({ signup_mode: form.signup_mode })}
					class="h-14 w-full rounded-lg border border-input bg-background px-4 text-body-lg font-semibold outline-none focus-visible:border-ring"
				>
					<option value="open">Open</option>
					<option value="invite">Invite only</option>
				</select>
			</div>
		</div>

		<div class="border-t border-border"></div>

		<div
			class="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-5"
		>
			<div>
				<div class={`${LABEL} text-destructive`}>Delete event</div>
				<div class="text-caption text-muted-foreground">
					Removes the event, RSVPs, and any uploaded recordings.
				</div>
			</div>
			<Button variant="destructive-outline" size="sm" onclick={() => (deleteOpen = true)}>
				<Trash2 class="size-3.5" /> delete event…
			</Button>
		</div>
	</div>

	<Dialog.Root bind:open={deleteOpen}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Delete "{event.name}"?</Dialog.Title>
				<Dialog.Description>
					This permanently removes the event, all RSVPs, and any uploaded recordings. This cannot be
					undone.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2">
				<Button variant="secondary" onclick={() => (deleteOpen = false)} disabled={deleting}>
					cancel
				</Button>
				<Button variant="destructive" onclick={doDelete} disabled={deleting}>
					{deleting ? 'deleting…' : 'delete event'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
