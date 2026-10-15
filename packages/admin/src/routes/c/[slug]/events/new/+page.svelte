<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '@civicos/shared/ui/button';
	import { zonedToISO } from '$lib/utils/event-time';
	import EventFields from '../EventFields.svelte';
	import {
		completeLocation,
		emptyEventForm,
		newEventProblems,
		parseCapacity,
		type EventForm
	} from '../event-form';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const campaign = $derived(data.campaign);
	const api = $derived(data.api);

	let form = $state<EventForm>(emptyEventForm());
	let creating = $state(false);
	/** A create the backend refused. Field problems sit beside their fields instead. */
	let formError = $state<string | null>(null);

	const eventsHref = $derived(resolve('/c/[slug]/events', { slug: campaign.slug }));

	// Withheld until the first submit, so an untouched form is not already
	// scolding; after that they follow the form as it is fixed.
	let attempted = $state(false);
	const fieldErrors = $derived(attempted ? newEventProblems(form) : {});

	/** The button is at the bottom and a problem may be scrolled out of view above it. */
	async function showFirstProblem(formEl: HTMLFormElement) {
		await tick();
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		formEl.querySelector('[role="alert"]')?.scrollIntoView({
			block: 'center',
			behavior: reduceMotion ? 'auto' : 'smooth'
		});
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (creating) return;
		attempted = true;
		formError = null;
		if (Object.keys(newEventProblems(form)).length) {
			await showFirstProblem(e.currentTarget as HTMLFormElement);
			return;
		}

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
		<EventFields bind:form rsvpLink={null} limitToFuture errors={fieldErrors} />

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
