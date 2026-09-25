<script lang="ts">
	import { campaignPath } from '@civicos/shared/data/place';
	import { safeHref } from '@civicos/shared/sanitize';
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { Button, InfoBar } from '$lib/components/ui';
	import EventCalendarInviteButton from '$lib/components/ui/EventCalendarInviteButton.svelte';
	import EventRegistrationModal from '$lib/components/ui/EventRegistrationModal.svelte';
	import { formatDurationLabel } from '$lib/config/regions';
	import { placeNameFor } from '$lib/config/campaign';
	import { formatTimeDuration } from '$lib/utils/dates.js';
	import { addHours, isBefore, format } from 'date-fns';
	import { onMount, onDestroy } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { session } from '$lib/services/session.svelte';

	const { data } = $props();
	const { event, eventDateFormatter, eventTimeFormatter } = data;

	// Where this Campaign runs, from the Campaign rather than from the region the
	// subdomain matched (#423).
	const placeName = $derived(placeNameFor(data.campaign, page.data.region));
	// Who hosts it, from the Campaign's own `metadata.org`. This used to be
	// `regions.ts`'s hostName and hostUrl, which credited The Bloom Project on
	// every Campaign created in admin.
	const org = $derived(data.campaign.org);

	const eventStartDate = $derived(new Date(event.startTime));
	const eventEndDate = $derived(new Date(event.endTime));
	let startTime = $derived(eventTimeFormatter.format(eventStartDate));
	let endTime = $derived(eventTimeFormatter.format(eventEndDate));

	let isPast = $state(false);
	let interval: ReturnType<typeof setInterval> | null = null;
	let showForm = $state(false);

	/**
	 * Whether this participant is on the event's attendance list.
	 *
	 * The server load is the answer (#420). The cached flag stands in only when
	 * it could not resolve one, so a participant whose registration the backend
	 * cannot confirm is not shown the signup form again.
	 */
	let isRegistered = $derived(
		data.registrationResolved ? data.isRegistered : session.isRegisteredForEvent(event.id)
	);
	let activeSection = $state<'details' | 'description'>('details');
	let scrollContainer = $state<HTMLElement | undefined>(undefined);

	const formattedDate = $derived(event ? format(new Date(event.startTime), 'EEEE, MMMM d') : '');
	const locationLabel = $derived(
		event.format === 'online' ? placeName : `in ${event.location?.city}`
	);

	const { hours: durationHours, minutes: durationMinutes } = formatTimeDuration(
		eventStartDate,
		eventEndDate
	);

	function updateIsPast() {
		if (!event) return;
		const target = new Date(event.startTime);
		isPast = isBefore(addHours(target, 2), new Date()); // past if >2h after start
	}

	onMount(() => {
		if (!event) return;
		updateIsPast();
		interval = setInterval(updateIsPast, 60000);
	});

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					activeSection = entry.isIntersecting ? 'description' : 'details';
				}
			},
			{ root: scrollContainer, rootMargin: '0px 0px -60% 0px', threshold: 0 }
		);
		const desc = document.getElementById('description');
		if (desc) observer.observe(desc);
		return () => observer.disconnect();
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	/**
	 * The modal has filed the attendance. Cache it so the button flips now, then
	 * re-run the load that reads the list back.
	 */
	async function onRegistered() {
		session.markRegisteredForEvent(event.id);
		await invalidate('civicos:attendance');
	}
</script>

{#if event}
	<!-- No card and no width cap, matching the list this came from. -->
	<AppShell border={false} class="max-w-none">
		<div
			class="flex h-full flex-col overflow-y-auto scroll-smooth bg-background"
			bind:this={scrollContainer}
		>
			<InfoBar {placeName} onBack={() => history.back()} backLabel="← BACK" />

			<!-- Header -->
			<div class="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-6 pb-0 md:pt-10">
				<!-- Title -->
				<h1
					class="text-center font-display text-4xl leading-8 font-medium tracking-display text-foreground md:text-5xl md:leading-[1.05]"
				>
					{event.name}
				</h1>

				<!-- Date & time -->
				<p class="text-md mt-2 font-sans font-medium text-foreground/70">
					{eventDateFormatter.format(eventStartDate)} | {startTime}
				</p>

				<!-- Description -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -- the Host's own site is external; the anchor opens mid-sentence, so no line disable fits -->
				<p
					class="mt-4 text-center font-sans text-base leading-6 font-medium text-foreground md:text-lg md:leading-7"
				>
					Join your neighbors {locationLabel} for a conversation about AI's impact on our lives.{#if org}
						Hosted by
						{#if org.url}<a
								href={safeHref(org.url)}
								target="_blank"
								rel="noopener noreferrer"
								class="text-destructive">{org.name}</a
							>{:else}{org.name}{/if}.
					{/if}
				</p>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->

				<!-- CTA. Full width on a phone, the landing form's width on desktop. -->
				<div class="mt-5 w-full md:max-w-sm">
					{#if isRegistered}
						<Button
							variant="soft"
							size="lg"
							fullWidth
							disabled
							class="bg-secondary/20 text-foreground opacity-100"
						>
							ALREADY REGISTERED <span class="text-2xl">✓</span>
						</Button>
					{:else}
						<Button
							variant="primary"
							fullWidth
							size="lg"
							onclick={() => {
								showForm = true;
							}}
							class="uppercase"
							disabled={isPast}
						>
							{#if isPast}Event has past{:else}SIGN UP TODAY{/if}
						</Button>
					{/if}

					{#if !isPast}
						<div class="mt-3 flex justify-center">
							<EventCalendarInviteButton {event} {org} />
						</div>
					{/if}
				</div>

				<!-- Divider -->
				<div class="mt-6 h-px w-full bg-[rgba(134,101,73,0.20)]"></div>
			</div>

			<!-- Sticky nav pills. Only where the sections stack: on desktop both are in view. -->
			<div
				class="sticky top-0 z-10 flex w-full items-center justify-center gap-2.5 bg-transparent px-6 py-3 md:hidden"
			>
				<a
					href="#details"
					class="overflow-hidden rounded-[20px] px-2.5 py-[3px] font-mono text-sm font-medium transition-colors {activeSection ===
					'details'
						? 'bg-foreground text-white'
						: 'bg-secondary/10 text-muted-foreground'}"
				>
					DETAILS
				</a>
				<a
					href="#description"
					class="overflow-hidden rounded-[20px] px-2.5 py-[3px] font-mono text-sm font-medium transition-colors {activeSection ===
					'description'
						? 'bg-foreground text-white'
						: 'bg-secondary/10 text-muted-foreground'}"
				>
					DESCRIPTION
				</a>
			</div>

			<!-- Content sections. Side by side on desktop. -->
			<div
				class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pt-4 pb-10 md:grid md:grid-cols-2 md:items-start md:gap-10 md:pt-8"
			>
				<!-- Details section -->
				<section id="details" class="scroll-mt-12">
					<div
						class="overflow-hidden rounded-[30px] bg-white shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)]"
					>
						<!-- Location row -->
						<div class="flex items-start gap-4 border-b border-foreground/10 px-5 py-5">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="22"
								viewBox="0 0 14 20"
								fill="currentColor"
								class="mt-0.5 shrink-0 text-destructive"
							>
								<path
									d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
								/>
							</svg>
							<div>
								<p class="font-sans text-xl leading-5 font-bold text-foreground">
									{event.location
										? `${event.location.venue_name}, ${event.location.city}`
										: 'Online'}
								</p>
								{#if event.location?.address_line_1}
									<p class="mt-2 font-sans text-sm leading-4 font-medium text-foreground/80">
										{event.location.address_line_1}
									</p>
								{/if}
							</div>
						</div>
						<!-- Date row -->
						<div class="flex items-center gap-4 border-b border-foreground/10 px-5 py-5">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="shrink-0 text-destructive"
							>
								<path
									d="M9 1v2h6V1h2v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2Zm11 9H4v10h16V10Z"
								/>
							</svg>
							<p class="font-sans text-xl leading-5 font-bold text-foreground">
								{formattedDate}
							</p>
						</div>
						<!-- Time row -->
						<div class="flex items-start gap-4 px-5 py-5">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="mt-0.5 shrink-0 text-destructive"
							>
								<path
									d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm1-10V7h-2v7h6v-2h-4Z"
								/>
							</svg>
							<div>
								<p class="font-sans text-xl leading-5 font-bold text-foreground">
									{startTime} – {endTime}
								</p>
								<p class="mt-2 font-sans text-sm leading-4 font-medium text-foreground/80">
									{formatDurationLabel(durationHours, durationMinutes)}
								</p>
							</div>
						</div>
					</div>
				</section>

				<!-- Description section -->
				<section id="description" class="scroll-mt-12">
					<p class="mb-4 font-mono text-xs font-medium text-foreground/50 uppercase">
						About This Conversation
					</p>
					<p
						class="font-sans text-base leading-6 font-medium whitespace-pre-line text-foreground/80"
					>
						{event.description}
					</p>
				</section>
			</div>
		</div>

		<EventRegistrationModal
			open={showForm}
			{event}
			conversationId={data.campaign.id}
			{org}
			api={data.api}
			{onRegistered}
		/>
	</AppShell>
{:else}
	<AppShell border={false} class="max-w-none">
		<div class="flex h-full flex-col items-center justify-center bg-background px-6">
			<h1 class="font-display text-2xl font-medium tracking-display text-foreground">
				Conversation not found
			</h1>
			<Button
				variant="primary"
				size="md"
				href={campaignPath(page.params.campaign, page.params.org, `events`)}
				class="mt-6"
			>
				← BACK TO CONVERSATIONS
			</Button>
		</div>
	</AppShell>
{/if}
