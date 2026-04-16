<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { InfoBar, ConversationEventCard } from '$lib/components/ui';
	import { conversationEvents } from '$lib/data/mock';
	import type { RegionConfig } from '$lib/config/regions';
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut, backOut } from 'svelte/easing';

	const region: RegionConfig = page.data.region;

	type Filter = 'all' | 'online' | 'in-person';
	let activeFilter: Filter = $state('all');

	const filters: { label: string; value: Filter }[] = [
		{ label: 'ALL', value: 'all' },
		{ label: 'ONLINE', value: 'online' },
		{ label: 'IN PERSON', value: 'in-person' }
	];

	const filtered = $derived(
		activeFilter === 'all'
			? conversationEvents
			: conversationEvents.filter((e) => e.format === activeFilter)
	);
</script>

<AppShell>
	<div class="flex h-full flex-col bg-gradient-primary overflow-y-auto">
		<InfoBar countyName={region.stateName} {region} />

		<!-- Header -->
		<div class="px-6 pt-6 pb-2 md:px-12">
			<span class="font-mono text-base font-medium uppercase text-foreground/70">
				AI &amp; OUR COMMUNITIES
			</span>
			<h1 class="mt-1 font-sans text-5xl font-extrabold leading-tight text-foreground">
				Community Conversations in {region.stateName}
			</h1>
			<p class="mt-4 font-sans text-lg font-medium leading-7 text-muted-foreground">
				These are 1-1.5 hour conversations with regular people in {region.stateName} about AI. We'll take the time to make sense of the issue, and discuss what we believe we can do to make sure AI benefits our communities.
			</p>
		</div>

		<!-- Filter Pills -->
		<div class="flex items-center gap-2.5 px-6 pt-4 pb-2 md:px-12 justify-center">
			{#each filters as f (f.value)}
				<button
					onclick={() => (activeFilter = f.value)}
					class="rounded-[20px] px-2 py-0.5 font-mono text-base font-medium transition-colors overflow-hidden {activeFilter === f.value
						? 'bg-foreground text-white'
						: 'bg-secondary/10 text-foreground/50'}"
				>
					{f.label}
				</button>
			{/each}
		</div>

		<!-- Conversation Cards -->
		<div class="flex flex-col gap-4 px-7 pt-4 pb-8 md:px-12">
			{#each filtered as event, i (event.slug)}
				<a
					href="/conversations/{event.slug}"
					class="block transition-transform active:scale-[0.98]"
					in:fly={{ y: 30, duration: 350, delay: i * 80, easing: backOut }}
					out:fade={{ duration: 200 }}
					animate:flip={{ duration: 300, easing: cubicOut }}
				>
					<ConversationEventCard {event} />
				</a>
			{/each}
		</div>
	</div>
</AppShell>
