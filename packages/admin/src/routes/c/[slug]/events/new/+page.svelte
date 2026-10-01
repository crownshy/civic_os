<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '@civicos/shared/ui/button';
	import { PAST_START_MESSAGE, zonedToISO } from '$lib/utils/event-time';
	import EventFields from '../EventFields.svelte';
	import {
		completeLocation,
		emptyEventForm,
		isBlankLocation,
		parseCapacity,
		type EventForm
	} from '../event-form';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const campaign = $derived(data.campaign);
	const api = $derived(data.api);

	let form = $state<EventForm>(emptyEventForm());
	let creating = $state(false);
	let formError = $state<string | null>(null);

	const eventsHref = $derived(resolve('/c/[slug]/events', { slug: campaign.slug }));

	/** The first reason the form can't be created yet, or null when it can. */
	function problem(): string | null {
		if (!form.name.trim()) return 'Give the event a name.';
		if (!form.start_date || !form.start_time || !form.end_time) {
			return 'Pick a date, start time and end time.';
		}
		if (form.end_time <= form.start_time) return 'The end time must be after the start time.';
		if (Date.parse(zonedToISO(form.start_date, form.start_time, form.time_zone)) < Date.now()) {
			return PAST_START_MESSAGE;
		}
		if (form.meet_mode === 'external_online' && !form.custom_event_link.trim()) {
			return 'Add the meeting link participants should join.';
		}
		// A venue can be added later, but half an address would be dropped silently.
		if (
			form.meet_mode === 'in_person' &&
			!isBlankLocation(form.location) &&
			!completeLocation(form.location)
		) {
			return 'Finish the address, or clear it and add it later.';
		}
		return null;
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (creating) return;
		formError = problem();
		if (formError) return;

		const inPerson = form.meet_mode === 'in_person';
		const link = form.custom_event_link.trim();
		const location = inPerson ? completeLocation(form.location) : null;
		const capacity = parseCapacity(form.capacity);

		creating = true;
		try {
			// The generated request type is deep-readonly, so optional fields have to
			// go in the literal rather than being assigned after the fact.
			const created = await api.CreateEvent(
				{
					name: form.name.trim(),
					description: form.description.trim(),
					start_time: zonedToISO(form.start_date, form.start_time, form.time_zone),
					end_time: zonedToISO(form.start_date, form.end_time, form.time_zone),
					signup_mode: form.signup_mode,
					default_time_zone: form.time_zone,
					...(capacity ? { capacity } : {}),
					...(location ? { location } : {}),
					...(form.meet_mode === 'external_online' ? { custom_event_link: link } : {})
				},
				{ params: { conversation_id: campaign.id } }
			);
			// CreateEvent takes no format, so set it when the backend's default differs.
			const format = inPerson ? 'in_person' : 'online';
			if (created.format !== format) {
				await api.UpdateEvent(
					{ format },
					{ params: { conversation_id: campaign.id, event_id: created.id } }
				);
			}
			await goto(
				resolve('/c/[slug]/events/[eventSlug]', { slug: campaign.slug, eventSlug: created.id }),
				{ invalidate: ['events:list'] }
			);
		} catch (err) {
			console.error('CreateEvent failed', err);
			formError = "Couldn't create the event. Try again.";
			creating = false;
		}
	}
</script>

<div class="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto px-8 py-8">
	<form onsubmit={submit} novalidate class="space-y-8">
		<EventFields bind:form rsvpLink={null} limitToFuture />

		<div class="border-t border-border"></div>

		<div class="flex flex-wrap items-center justify-end gap-3">
			{#if formError}
				<p role="alert" class="mr-auto text-body text-destructive">{formError}</p>
			{/if}
			<Button variant="secondary" href={eventsHref}>cancel</Button>
			<Button type="submit" disabled={creating}>
				{creating ? 'creating…' : 'create event'}
			</Button>
		</div>
	</form>
</div>
