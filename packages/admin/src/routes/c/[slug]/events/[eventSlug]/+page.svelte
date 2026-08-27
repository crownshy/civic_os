<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import * as ToggleGroup from '@civicos/shared/ui/toggle-group';
	import { Check, Copy, MapPin, Monitor, Trash2 } from '@lucide/svelte';
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

	type Form = {
		name: string;
		description: string;
		format: 'in_person' | 'online';
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

	function buildForm(e: typeof event): Form {
		if (!e) {
			return {
				name: '',
				description: '',
				format: 'in_person',
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
			format: (e.format as Form['format']) ?? 'in_person',
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

	$effect(() => {
		if (loaded || !event) return;
		form = buildForm(event);
		loaded = true;
	});

	const isInPerson = $derived(form.format === 'in_person');
	const rsvpLink = $derived(event ? `civicos.app/c/${page.params.slug}/e/${event.id}` : '');

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
	function copyLink() {
		navigator.clipboard?.writeText(rsvpLink);
		copied = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1500);
	}
</script>

{#if event}
	<div class="space-y-5">
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

		<div class="space-y-1.5">
			<Label class="text-caption tracking-tight text-muted-foreground">MODE</Label>
			<ToggleGroup.Root
				type="single"
				value={form.format}
				onValueChange={(v) => {
					if (!v) return;
					form.format = v as Form['format'];
					save({ format: form.format });
				}}
				aria-label="Event mode"
			>
				<ToggleGroup.Item value="in_person" aria-label="In-person">
					<MapPin />
					in-person
				</ToggleGroup.Item>
				<ToggleGroup.Item value="online" aria-label="Online">
					<Monitor />
					online
				</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>

		<div class="space-y-1.5">
			<Label for="ev-name" class="text-caption tracking-tight text-muted-foreground">NAME</Label>
			<Input
				id="ev-name"
				bind:value={form.name}
				onblur={() => form.name.trim() !== event.name && save({ name: form.name.trim() })}
				class="h-10"
			/>
		</div>

		<div class="grid grid-cols-1 gap-3.5 md:grid-cols-3">
			<div class="space-y-1.5">
				<Label for="ev-date" class="text-caption tracking-tight text-muted-foreground">DATE</Label>
				<Input
					id="ev-date"
					type="date"
					bind:value={form.start_date}
					onblur={saveTimes}
					class="h-10"
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="ev-start" class="text-caption tracking-tight text-muted-foreground">START</Label
				>
				<Input
					id="ev-start"
					type="time"
					bind:value={form.start_time}
					onblur={saveTimes}
					class="h-10"
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="ev-end" class="text-caption tracking-tight text-muted-foreground">END</Label>
				<Input id="ev-end" type="time" bind:value={form.end_time} onblur={saveTimes} class="h-10" />
			</div>
		</div>

		<div class="space-y-1.5">
			<Label for="ev-tz" class="text-caption tracking-tight text-muted-foreground">TIME ZONE</Label>
			<select
				id="ev-tz"
				bind:value={form.time_zone}
				onchange={saveTimes}
				class="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				{#each TIMEZONES as tz (tz)}
					<option value={tz}>{tz}</option>
				{/each}
			</select>
		</div>

		{#if isInPerson}
			<div class="space-y-3">
				<Label class="text-caption tracking-tight text-muted-foreground">LOCATION</Label>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<Input
						bind:value={form.location.venue_name}
						onblur={saveLocation}
						placeholder="Venue name"
						class="h-10"
					/>
					<Input
						bind:value={form.location.address_line_1}
						onblur={saveLocation}
						placeholder="Address line 1"
						class="h-10"
					/>
					<Input
						bind:value={form.location.address_line_2}
						onblur={saveLocation}
						placeholder="Address line 2 (optional)"
						class="h-10"
					/>
					<Input
						bind:value={form.location.city}
						onblur={saveLocation}
						placeholder="City"
						class="h-10"
					/>
					<Input
						bind:value={form.location.state_province}
						onblur={saveLocation}
						placeholder="State / province"
						class="h-10"
					/>
					<Input
						bind:value={form.location.postal_code}
						onblur={saveLocation}
						placeholder="Postal code"
						class="h-10"
					/>
					<Input
						bind:value={form.location.country_code}
						onblur={saveLocation}
						placeholder="Country code (e.g. US)"
						class="h-10"
					/>
				</div>
				<p class="text-label text-muted-foreground">
					All required address fields must be filled before location saves.
				</p>
			</div>
		{/if}

		<div class="space-y-1.5">
			<Label for="ev-desc" class="text-caption tracking-tight text-muted-foreground"
				>DESCRIPTION</Label
			>
			<textarea
				id="ev-desc"
				bind:value={form.description}
				onblur={() =>
					form.description.trim() !== event.description &&
					save({ description: form.description.trim() })}
				rows="4"
				class="w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-body leading-relaxed transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
			></textarea>
		</div>

		<div class="grid grid-cols-1 gap-3.5 md:grid-cols-3">
			<div class="space-y-1.5">
				<Label for="ev-cap" class="text-caption tracking-tight text-muted-foreground"
					>CAPACITY</Label
				>
				<Input
					id="ev-cap"
					type="number"
					min="2"
					bind:value={form.capacity}
					onblur={saveCapacity}
					class="h-10"
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="ev-sign" class="text-caption tracking-tight text-muted-foreground"
					>SIGNUP MODE</Label
				>
				<select
					id="ev-sign"
					bind:value={form.signup_mode}
					onchange={() => save({ signup_mode: form.signup_mode })}
					class="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				>
					<option value="open">open</option>
					<option value="invite">invite only</option>
				</select>
			</div>
			<div class="space-y-1.5">
				<Label class="text-caption tracking-tight text-muted-foreground">CONTACT / HOST</Label>
				<div
					class="flex h-10 items-center rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-card px-3 text-body shadow-card"
				>
					{campaign.hostName}
				</div>
			</div>
		</div>

		<div class="space-y-1.5">
			<Label class="text-caption tracking-tight text-muted-foreground">RSVP LINK</Label>
			<div class="flex items-center gap-2">
				<div
					class="flex-1 truncate rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-card px-3 py-2.5 text-caption shadow-card"
				>
					{rsvpLink}
				</div>
				<Button variant="outline" size="sm" onclick={copyLink}>
					{#if copied}
						<Check class="size-3.5" /> copied
					{:else}
						<Copy class="size-3.5" /> copy
					{/if}
				</Button>
			</div>
			<p class="text-label text-muted-foreground">
				Autofilled. Replace with a Zoom or other link if you're hosting online.
			</p>
		</div>

		<div class="my-4 border-t border-border"></div>

		<div
			class="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3.5"
		>
			<div>
				<div class="text-caption font-bold tracking-tight text-destructive">DELETE EVENT</div>
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
