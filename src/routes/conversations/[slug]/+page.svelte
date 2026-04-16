<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { Button, InfoBar } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';
	import type { ConversationEvent } from '$lib/types/mock-data';
	import { onMount, onDestroy } from 'svelte';

	const region: RegionConfig = page.data.region;
	const slug = $derived(page.params.slug);

	const event: ConversationEvent | undefined = $derived(region.events.find((e) => e.slug === slug));

	let daysLeft = $state(0);
	let hoursLeft = $state(0);
	let minutesLeft = $state(0);
	let isPast = $state(false);
	let interval: ReturnType<typeof setInterval>;

	function updateCountdown() {
		if (!event) return;
		const now = new Date();
		const target = new Date(event.date);
		const rawDiff = target.getTime() - now.getTime();
		isPast = rawDiff < -2 * 60 * 60 * 1000; // past if >2h after start
		const diff = Math.max(0, rawDiff);
		daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
		hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	}

	onMount(() => {
		updateCountdown();
		interval = setInterval(updateCountdown, 60000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

{#if event}
	<AppShell>
		<div class="flex h-full flex-col bg-gradient-primary overflow-y-auto">
			<InfoBar
				countyName={region.stateName}
				{region}
				onBack={() => history.back()}
				backLabel="← BACK"
			/>

			<!-- Content -->
			<div class="flex flex-1 flex-col px-6 pt-4 md:px-12" style="view-transition-name: detail-hero;">
				<!-- Topic label -->
				<span class="text-center font-mono text-base font-medium uppercase text-foreground">
					{event.topic}
				</span>

				<!-- Title -->
				<h1 class="mt-3 text-center font-sans text-5xl font-extrabold leading-12 text-foreground">
					{event.title}
				</h1>

				<!-- Location + Time -->
				<div class="mt-4 flex items-center justify-center gap-1">
					<span class="font-mono text-base font-medium uppercase text-foreground">
						{event.location} &bull; {event.time}
					</span>
				</div>

				<!-- Description -->
				<p class="font-sans text-base font-medium leading-6 mt-6 text-muted-foreground">
					{event.description}
				</p>
			</div>

			<!-- Bottom CTA -->
			<div class="shrink-0 px-6 pb-6 pt-4 md:px-12">
				
				<!-- Illustration placeholder -->
				<div class="flex h-48 mb-10 items-center justify-center overflow-hidden rounded-xl bg-accent">
					<span class="font-mono text-lg font-medium text-accent-foreground/50">ILLUSTRATION</span>
				</div>

				<!-- Countdown -->
				<p class="mb-3 text-center font-mono text-base font-medium uppercase text-foreground">
					{#if isPast}
						EVENT HAS PASSED
					{:else if daysLeft > 0}
						EVENT STARTS IN {daysLeft} {daysLeft === 1 ? 'DAY' : 'DAYS'}
					{:else if hoursLeft > 0}
						EVENT STARTS IN {hoursLeft}H {minutesLeft}M
					{:else}
						HAPPENING NOW
					{/if}
				</p>

				<Button variant="primary" fullWidth size="lg">
					SIGN UP TODAY
				</Button>
			</div>
		</div>
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
