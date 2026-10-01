<script lang="ts">
	import { untrack } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { invalidate } from '$lib/activity.svelte';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Check, Trash2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { isoToWallClock, PAST_START_MESSAGE, zonedToISO } from '$lib/utils/event-time';
	import EventFields from '../EventFields.svelte';
	import {
		BROWSER_TZ,
		completeLocation,
		emptyEventForm,
		emptyLocation,
		parseCapacity,
		type EventField,
		type EventForm,
		type MeetMode
	} from '../event-form';

	let { data } = $props();

	const event = $derived(data.event);
	const campaign = $derived(data.campaign);
	const api = $derived(data.api);

	function meetModeOf(e: NonNullable<typeof event>): MeetMode {
		if (e.format === 'in_person') return 'in_person';
		return e.customEventLink ? 'external_online' : 'civicos_online';
	}

	function buildForm(e: typeof event): EventForm {
		if (!e) return emptyEventForm();
		// The event's own zone, so an editor elsewhere does not re-zone it on save.
		const stored = e.defaultTimeZone;
		const tz = typeof stored === 'string' && stored ? stored : BROWSER_TZ;
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
			capacity: e.capacity ?? null,
			signup_mode: (e.signupMode as EventForm['signup_mode']) ?? 'open',
			time_zone: tz,
			location: loc
				? {
						venue_name: loc.venue_name ?? '',
						address_line_1: loc.address_line_1 ?? '',
						address_line_2: loc.address_line_2 ?? '',
						city: loc.city ?? '',
						state_province: loc.state_province ?? '',
						postal_code: loc.postal_code ?? '',
						country_code: loc.country_code ?? ''
					}
				: emptyLocation()
		};
	}

	// A one-time working copy: the layout remounts this page per event, and
	// re-reading `event` would reset the form after every save's invalidate.
	let form = $state<EventForm>(untrack(() => buildForm(event)));
	// Keyed by what failed, so a later success on another field cannot hide it.
	let failures = $state<Record<string, string>>({});
	const error = $derived(Object.values(failures)[0] ?? null);
	let pending = $state(0);
	const saving = $derived(pending > 0);
	let savedTick = $state(0);
	let deleting = $state(false);
	let deleteOpen = $state(false);

	// The public Campaign address plus civicos' event route. Empty when the
	// Campaign has no address yet (no participant apex, or no slug).
	const rsvpLink = $derived(
		event && campaign.shareUrl ? `${campaign.shareUrl}/events/${event.id}` : ''
	);

	type Patch = Record<string, unknown>;

	// Saves run one at a time so an older write cannot land after a newer one.
	let queue: Promise<void> = Promise.resolve();

	function save(field: string, patch: Patch) {
		// Captured now: by the time a queued save runs, the switcher may have moved on.
		const target = event;
		const conversationId = campaign.id;
		if (!target) return;
		pending++;
		queue = queue.then(async () => {
			try {
				await api.UpdateEvent(patch, {
					params: { conversation_id: conversationId, event_id: target.id }
				});
				delete failures[field];
				await invalidate(`events:detail:${target.id}`);
				savedTick++;
			} catch (e) {
				console.error('UpdateEvent failed', e);
				failures[field] = 'Save failed.';
			} finally {
				pending--;
			}
		});
	}

	// Location is left out: an incomplete address is deliberately never saved.
	const BLUR_SAVED = [
		'name',
		'description',
		'custom_event_link',
		'start_date',
		'start_time',
		'end_time',
		'capacity',
		'signup_mode',
		'time_zone'
	] as const;

	// Fields save on blur, and closing the tab never blurs, so ask first. An
	// in-app link blurs the field before it navigates, which saves it.
	beforeNavigate(({ willUnload, cancel }) => {
		if (!willUnload || !event) return;
		const stored = buildForm(event);
		const text = (v: string | number | null) => String(v ?? '').trim();
		const unsaved = BLUR_SAVED.some((key) => text(form[key]) !== text(stored[key]));
		if (saving || unsaved) cancel();
	});

	function saveMeetMode() {
		const patch: Patch = { format: form.meet_mode === 'in_person' ? 'in_person' : 'online' };
		// Only the third mode carries a custom link; the others fall back to the RSVP page.
		if (form.meet_mode !== 'external_online') patch.custom_event_link = null;
		save('meetMode', patch);
	}

	function saveCustomLink() {
		const link = form.custom_event_link.trim();
		if (link === (event?.customEventLink ?? '')) return;
		save('link', { custom_event_link: link || null });
	}

	function saveName() {
		const name = form.name.trim();
		if (!event || name === event.name) return;
		if (!name) {
			failures.name = 'The event needs a name.';
			return;
		}
		delete failures.name;
		save('name', { name });
	}

	function saveTimes() {
		if (!event || !form.start_date || !form.start_time || !form.end_time) return;
		const start_time = zonedToISO(form.start_date, form.start_time, form.time_zone);
		const end_time = zonedToISO(form.start_date, form.end_time, form.time_zone);
		if (Date.parse(end_time) <= Date.parse(start_time)) {
			failures.times = 'The end time must be after the start time.';
			return;
		}
		delete failures.times;
		// Compared as instants: the backend's ISO spelling need not match ours.
		const unchanged =
			Date.parse(start_time) === Date.parse(event.startTime) &&
			Date.parse(end_time) === Date.parse(event.endTime) &&
			form.time_zone === event.defaultTimeZone;
		if (unchanged) return;
		if (Date.parse(start_time) < Date.now()) {
			failures.times = PAST_START_MESSAGE;
			return;
		}
		save('times', { start_time, end_time, default_time_zone: form.time_zone });
	}

	function saveLocation() {
		const loc = completeLocation(form.location);
		if (!loc) return;
		save('location', { location: loc });
	}

	function saveCapacity() {
		const capacity = parseCapacity(form.capacity);
		if (capacity === (event?.capacity ?? null)) return;
		save('capacity', { capacity });
	}

	function saveDescription() {
		const description = form.description.trim();
		if (!event || description === event.description) return;
		save('description', { description });
	}

	const savers: Record<EventField, () => void> = {
		name: saveName,
		times: saveTimes,
		meetMode: saveMeetMode,
		link: saveCustomLink,
		location: saveLocation,
		description: saveDescription,
		capacity: saveCapacity,
		signup: () => save('signup', { signup_mode: form.signup_mode })
	};

	// Past dates are greyed out only while the event is still ahead: an event
	// that already happened keeps its own date valid (#468).
	const isUpcoming = $derived(!event || Date.parse(event.startTime) > Date.now());

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
			failures.delete = 'Delete failed.';
			deleting = false;
		}
	}

	const LABEL = 'text-caption font-bold tracking-tight uppercase';
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

		<EventFields
			bind:form
			{rsvpLink}
			limitToFuture={isUpcoming}
			oncommit={(field) => savers[field]()}
		/>

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
