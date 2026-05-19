<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { Button, InfoBar, SwipeCarousel } from '$lib/components/ui';
	import { getEventFullDescription, type RegionConfig } from '$lib/config/regions';
	import type { ConversationEvent } from '$lib/types/mock-data';
	import { differenceInDays, differenceInHours, differenceInMinutes, addHours, isBefore, format } from 'date-fns';
	import { onMount, onDestroy } from 'svelte';

	const region: RegionConfig = page.data.region;
	const slug = $derived(page.params.slug);

	const event: ConversationEvent | undefined = $derived(region.events.find((e) => e.slug === slug));

	let daysLeft = $state(0);
	let hoursLeft = $state(0);
	let minutesLeft = $state(0);
	let isPast = $state(false);
	let interval: ReturnType<typeof setInterval> | null = null;
	let showForm = $state(false);
	let isRegistered = $state(false);
	let activeTab = $state(0);
	let calendarReady = $state(false);

	const formattedDate = $derived(event ? format(new Date(event.date), 'EEEE, MMMM d') : '');
	const headerDate = $derived(event ? format(new Date(event.date), 'MMMM d') : '');
	const locationLabel = $derived(event ? (event.format === 'online' ? region.stateName : event.location.split(',')[0]) : '');
	let iframeLoaded = $state(false);

	// Calendar-specific derived values
	const calStartDate = $derived(event ? event.date.split('T')[0] : '');

	const calStartTime = $derived.by(() => {
		if (!event) return '';
		return event.date.split('T')[1].slice(0, 5);
	});

	function parseTime12To24(t: string): string {
		const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
		if (!m) return '';
		let h = parseInt(m[1]);
		const min = m[2];
		if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
		else if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
		return `${String(h).padStart(2, '0')}:${min}`;
	}

	const calEndTime = $derived(event?.endTime ? parseTime12To24(event.endTime) : '');

	const calLocation = $derived.by(() => {
		if (!event) return '';
		if (event.format === 'online') return 'Videoconference link to be sent 1 day before call.';
		return [event.venueName, event.address].filter(Boolean).join(' — ');
	});

	const calTimeZone = $derived.by(() => {
		if (!event) return 'currentBrowser';
		const tzMatch = event.date.match(/([+-]\d{2}:\d{2})$/);
		if (!tzMatch) return 'currentBrowser';
		const offsets: Record<string, string> = {
			'-04:00': 'America/New_York',
			'-05:00': 'America/Chicago',
			'-06:00': 'America/Denver',
			'-07:00': 'America/Los_Angeles'
		};
		return offsets[tzMatch[1]] ?? 'currentBrowser';
	});

	const calDescription = $derived(
		event
			? `${event.fullDescription ?? getEventFullDescription(event, region.stateName)}\n\nHosted by ${region.hostName}. Visit ${region.hostUrl} for more details.`
			: ''
	);

	function updateCountdown() {
		if (!event) return;
		const now = new Date();
		const target = new Date(event.date);
		isPast = isBefore(addHours(target, 2), now); // past if >2h after start
		if (isPast || isBefore(target, now)) {
			daysLeft = 0;
			hoursLeft = 0;
			minutesLeft = 0;
			return;
		}
		daysLeft = differenceInDays(target, now);
		hoursLeft = differenceInHours(target, now) % 24;
		minutesLeft = differenceInMinutes(target, now) % 60;
	}

	onMount(() => {
		if (!event) return;
		isRegistered = localStorage.getItem(`registered-${slug}`) === 'true';
		updateCountdown();
		interval = setInterval(updateCountdown, 60000);
		import('add-to-calendar-button').then(() => {
			calendarReady = true;
		});
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	function onFrameMessage(e: any) {
		if (e.origin !== 'https://forms.bloomproject.us') return;
		if (e.data.eventName === 'HIDE_EMBED_MODAL') {
			isRegistered = true;
			localStorage.setItem(`registered-${slug}`, 'true');
			setTimeout(() => {
				showForm = false;
			}, 2000);
		}
	}

	$effect(() => {
		window.addEventListener('message', onFrameMessage);

		return () => {
			window.removeEventListener('message', onFrameMessage);
		};
	});

</script>

<svelte:head>
  <script src="https://www.unpkg.com/@heyform-inc/embed@latest/dist/index.umd.js"></script>
</svelte:head>

{#if event}
	<AppShell>
		<div class="flex h-full flex-col bg-gradient-primary overflow-y-auto">
			<InfoBar
				countyName={region.stateName}
				{region}
				onBack={() => history.back()}
				backLabel="← BACK"
			/>

			<!-- Header -->
			<div class="flex flex-col items-center px-6 pt-6 pb-0 md:px-12">
				<!-- Title -->
				<h1 class="text-center font-sans text-4xl font-extrabold leading-[2rem] text-foreground">
					{event.title}
				</h1>

				<!-- Date & time -->
				<p class="mt-2 font-sans text-md font-medium text-foreground/70">
					{headerDate} | {event.time}
				</p>

				<!-- Description -->
				<p class="mt-4 text-center font-sans text-base font-medium leading-6 text-foreground">
					Join your neighbors in {locationLabel} for a conversation about AI's impact on our lives. Hosted by <a href={region.hostUrl} target="_blank" rel="noopener noreferrer" class="text-destructive">{region.hostName}</a>.
				</p>

				<!-- CTA -->
				<div class="mt-5 w-full">
					<!-- <p class="mb-3 text-center text-base font-medium text-foreground">
						{#if isPast}
							Event has passed.
						{:else if daysLeft > 0}
							Event starts in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
						{:else if hoursLeft > 0}
							Event starts in {hoursLeft}h {minutesLeft}m
						{:else if minutesLeft > 0}
							Event starts in {minutesLeft} {minutesLeft === 1 ? 'min' : 'mins'}
						{:else}
							HAPPENING NOW
						{/if}
					</p> -->

					{#if isRegistered}
						<button
							class="w-full rounded-full bg-secondary/20 px-7 py-3.5 font-mono text-lg font-medium text-foreground"
							disabled
						>
							ALREADY REGISTERED <span class="text-2xl">✓</span>
						</button>
					{:else}
						<Button variant="primary" fullWidth size="lg" onclick={() => { showForm = true; iframeLoaded = false; }}>
							SIGN UP TODAY
						</Button>
					{/if}

					{#if calendarReady && !isPast}
						<div class="mt-3 flex justify-center">
							<add-to-calendar-button
								name={event.title}
								startDate={calStartDate}
								startTime={calStartTime}
								endTime={calEndTime || undefined}
								location={calLocation}
								description={calDescription}
								timeZone={calTimeZone}
								options="'Google','Apple','iCal','Outlook.com'"
								label="ADD TO CALENDAR"
								buttonStyle="round"
								size="3"
								lightMode="bodyScheme"
								styleLight="--btn-background: rgba(166,114,46,0.10); --btn-text: #532A0E; --btn-border: transparent; --btn-shadow: none; --btn-hover-background: rgba(166,114,46,0.20); --font: 'DM Mono', monospace;"
							></add-to-calendar-button>
						</div>
					{/if}
				</div>

				<!-- Divider -->
				<div class="mt-6 h-px w-full bg-[rgba(134,101,73,0.20)]"></div>
			</div>

			<!-- Content -->
			<div class="flex flex-1 flex-col items-center px-6 pt-6 md:px-12">
				<!-- Tab switcher -->
				<div class="flex items-center gap-2.5">
					<button
						onclick={() => (activeTab = 0)}
						class="rounded-[20px] px-2.5 py-[3px] font-mono text-sm font-medium transition-colors overflow-hidden {activeTab === 0
							? 'bg-foreground text-white'
							: 'bg-secondary/10 text-muted-foreground'}"
					>
						DETAILS
					</button>
					<button
						onclick={() => (activeTab = 1)}
						class="rounded-[20px] px-2.5 py-[3px] font-mono text-sm font-medium transition-colors overflow-hidden {activeTab === 1
							? 'bg-foreground text-white'
							: 'bg-secondary/10 text-muted-foreground'}"
					>
						DESCRIPTION
					</button>
				</div>

				<!-- Card carousel -->
				<div class="mt-4 w-full">
					<SwipeCarousel count={2} bind:index={activeTab} hideDots={true}>
						{#snippet children(i)}
							{#if i === 0}
								<!-- Details Card -->
								<div class="rounded-[30px] bg-linear-to-b from-white to-white/80 shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)] overflow-hidden">
									<!-- Location row -->
									<div class="flex items-start gap-4 border-b border-foreground/10 px-5 py-5">
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="22" viewBox="0 0 14 20" fill="currentColor" class="mt-0.5 shrink-0 text-destructive">
											<path d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
										</svg>
										<div>
											<p class="font-sans text-xl font-bold leading-5 text-foreground">{event.venueName || event.location}</p>
											{#if event.address}
												<p class="mt-2 font-sans text-sm font-medium leading-4 text-foreground/80">{event.address}</p>
											{/if}
										</div>
									</div>
									<!-- Date row -->
									<div class="flex items-center gap-4 border-b border-foreground/10 px-5 py-5">
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="shrink-0 text-destructive">
											<path d="M9 1v2h6V1h2v2h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2Zm11 9H4v10h16V10Z"/>
										</svg>
										<p class="font-sans text-xl font-bold leading-5 text-foreground">{formattedDate}</p>
									</div>
									<!-- Time row -->
									<div class="flex items-start gap-4 px-5 py-5">
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="mt-0.5 shrink-0 text-destructive">
											<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm1-10V7h-2v7h6v-2h-4Z"/>
										</svg>
										<div>
											<p class="font-sans text-xl font-bold leading-5 text-foreground">{event.time}{#if event.endTime} – {event.endTime}{/if}</p>
											{#if event.duration}
												<p class="mt-2 font-sans text-sm font-medium leading-4 text-foreground/80">{event.duration}</p>
											{/if}
										</div>
									</div>
								</div>
							{:else}
								<!-- Description Card -->
								<div class="rounded-[30px] bg-linear-to-b from-white to-white/80 p-7 shadow-[0px_4px_24.3px_0px_rgba(134,101,73,0.20)] overflow-hidden min-h-[240px]">
									<p class="mt-3 font-sans text-md font-medium leading-6 text-foreground/80 whitespace-pre-line">
										{event.fullDescription ?? getEventFullDescription(event, region.stateName)}
									</p>
								</div>
							{/if}
						{/snippet}
					</SwipeCarousel>
				</div>
			</div>

		</div>

		{#if showForm}
			<div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-primary">
				<button
					class="absolute z-50 top-4 left-4 font-mono text-sm uppercase text-foreground"
					onclick={() => (showForm = false)}
				>
					← BACK TO CONVERSATIONS
				</button>
				<div class="relative flex flex-col items-center gap-4 px-6 py-10 w-full grow">
					{#if !iframeLoaded}
						<div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
							<div class="h-10 w-10 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground"></div>
							<span class="font-mono text-sm uppercase text-foreground/60">Loading form...</span>
						</div>
					{/if}
					<iframe
						title='event signup form'
						src={`https://forms.bloomproject.us/form/IspxhmX8?event_id=${encodeURIComponent(event.slug)}&region=${region.slug}&hideAfterSubmit=true&autoClose=1`}
						width="100%"
						height="100%"
						frameborder="0"
						style="background: transparent;"
						class="transition-opacity duration-300 {iframeLoaded ? 'opacity-100' : 'opacity-0'}"
						onload={() => (iframeLoaded = true)}
					></iframe>
				</div>
			  </div>
		  {/if}
	  </AppShell>
  {:else}
	  <AppShell>
		<div class="flex h-full flex-col items-center justify-center bg-gradient-primary px-6">
			<h1 class="font-sans text-2xl font-bold text-foreground">Conversation not found</h1>
			<Button variant="primary" size="md" href="/conversations" class="mt-6">
				← BACK TO CONVERSATIONS
			</Button>
		</div>
	</AppShell>
{/if}
