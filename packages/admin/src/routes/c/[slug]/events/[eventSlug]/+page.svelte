<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import * as ToggleGroup from '@civicos/shared/ui/toggle-group';
	import { Check, Copy, MapPin, Monitor, Trash2 } from '@lucide/svelte';

	let { data } = $props();

	const event = $derived(data.event);
	const region = $derived(data.region);
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
				params: { conversation_id: region.conversationId, event_id: event.id }
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
				params: { conversation_id: region.conversationId, event_id: event.id }
			});
			deleteOpen = false;
			await goto(`/c/${region.slug}/events`, { invalidateAll: true });
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
	<div class="max-w-6xl space-y-5">
		<div class="flex items-center justify-end gap-3 text-sm">
			{#if saving}
				<span class="text-muted-foreground">saving…</span>
			{:else if savedTick > 0 && !error}
				{#key savedTick}
					<span class="text-primary inline-flex items-center gap-1">
						<Check class="size-3.5" /> saved
					</span>
				{/key}
			{/if}
			{#if error}
				<span class="text-destructive">{error}</span>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label class="text-muted-foreground text-sm tracking-tight">MODE</Label>
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
			<Label for="ev-name" class="text-muted-foreground text-sm tracking-tight">NAME</Label>
			<Input
				id="ev-name"
				bind:value={form.name}
				onblur={() => form.name.trim() !== event.name && save({ name: form.name.trim() })}
				class="h-10"
			/>
		</div>

		<div class="grid grid-cols-1 gap-3.5 md:grid-cols-3">
			<div class="space-y-1.5">
				<Label for="ev-date" class="text-muted-foreground text-sm tracking-tight">DATE</Label>
				<Input
					id="ev-date"
					type="date"
					bind:value={form.start_date}
					onblur={saveTimes}
					class="h-10"
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="ev-start" class="text-muted-foreground text-sm tracking-tight">START</Label>
				<Input
					id="ev-start"
					type="time"
					bind:value={form.start_time}
					onblur={saveTimes}
					class="h-10"
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="ev-end" class="text-muted-foreground text-sm tracking-tight">END</Label>
				<Input
					id="ev-end"
					type="time"
					bind:value={form.end_time}
					onblur={saveTimes}
					class="h-10"
				/>
			</div>
		</div>

		<div class="space-y-1.5">
			<Label for="ev-tz" class="text-muted-foreground text-sm tracking-tight">TIME ZONE</Label>
			<select
				id="ev-tz"
				bind:value={form.time_zone}
				onchange={saveTimes}
				class="bg-muted/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border px-3 text-base transition-colors outline-none focus-visible:ring-[3px]"
			>
				{#each TIMEZONES as tz (tz)}
					<option value={tz}>{tz}</option>
				{/each}
			</select>
		</div>

		{#if isInPerson}
			<div class="space-y-3">
				<Label class="text-muted-foreground text-sm tracking-tight">LOCATION</Label>
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
				<p class="text-muted-foreground text-xs">
					All required address fields must be filled before location saves.
				</p>
			</div>
		{/if}

		<div class="space-y-1.5">
			<Label for="ev-desc" class="text-muted-foreground text-sm tracking-tight">DESCRIPTION</Label>
			<textarea
				id="ev-desc"
				bind:value={form.description}
				onblur={() =>
					form.description.trim() !== event.description &&
					save({ description: form.description.trim() })}
				rows="4"
				class="bg-muted/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2.5 text-base leading-relaxed transition-colors outline-none focus-visible:ring-[3px]"
			></textarea>
		</div>

		<div class="grid grid-cols-1 gap-3.5 md:grid-cols-3">
			<div class="space-y-1.5">
				<Label for="ev-cap" class="text-muted-foreground text-sm tracking-tight">CAPACITY</Label>
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
				<Label for="ev-sign" class="text-muted-foreground text-sm tracking-tight">SIGNUP MODE</Label>
				<select
					id="ev-sign"
					bind:value={form.signup_mode}
					onchange={() => save({ signup_mode: form.signup_mode })}
					class="bg-muted/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border px-3 text-base transition-colors outline-none focus-visible:ring-[3px]"
				>
					<option value="open">open</option>
					<option value="invite">invite only</option>
				</select>
			</div>
			<div class="space-y-1.5">
				<Label class="text-muted-foreground text-sm tracking-tight">CONTACT / HOST</Label>
				<div
					class="bg-card shadow-card flex h-10 items-center rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 text-base"
				>
					{region.hostName}
				</div>
			</div>
		</div>

		<div class="space-y-1.5">
			<Label class="text-muted-foreground text-sm tracking-tight">RSVP LINK</Label>
			<div class="flex items-center gap-2">
				<div
					class="bg-card shadow-card flex-1 truncate rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-2.5 text-sm"
				>
					{rsvpLink}
				</div>
				<Button variant="outline" size="sm" onclick={copyLink} class="gap-1.5">
					{#if copied}
						<Check class="size-3.5" /> copied
					{:else}
						<Copy class="size-3.5" /> copy
					{/if}
				</Button>
			</div>
			<p class="text-muted-foreground text-xs">
				Autofilled. Replace with a Zoom or other link if you're hosting online.
			</p>
		</div>

		<div class="border-border my-4 border-t"></div>

		<div
			class="bg-destructive/5 border-destructive/30 flex items-center justify-between rounded-lg border px-4 py-3.5"
		>
			<div>
				<div class="text-destructive text-sm font-bold tracking-tight">DELETE EVENT</div>
				<div class="text-muted-foreground text-sm">
					Removes the event, RSVPs, and any uploaded recordings.
				</div>
			</div>
			<Button
				variant="outline"
				size="sm"
				class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
				onclick={() => (deleteOpen = true)}
			>
				<Trash2 class="size-3.5" /> delete event…
			</Button>
		</div>
	</div>

	<Dialog.Root bind:open={deleteOpen}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Delete "{event.name}"?</Dialog.Title>
				<Dialog.Description>
					This permanently removes the event, all RSVPs, and any uploaded recordings. This cannot be undone.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2">
				<Button variant="outline" onclick={() => (deleteOpen = false)} disabled={deleting}>
					cancel
				</Button>
				<Button variant="destructive" onclick={doDelete} disabled={deleting}>
					{deleting ? 'deleting…' : 'delete event'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
