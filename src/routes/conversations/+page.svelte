<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { InfoBar, ConversationEventCard } from '$lib/components/ui';
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
		(activeFilter === 'all'
			? region.events
			: region.events.filter((e) => e.format === activeFilter)
		).toSorted((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	);
</script>

<AppShell>
	<div class="flex h-full flex-col bg-gradient-primary overflow-y-auto">
		<InfoBar countyName={region.stateName} {region} />

		<!-- Header -->
		<div class="flex flex-col items-center px-6 pt-6 pb-0 md:px-12">
			<div class="rounded-full bg-foreground px-3.5 py-1 overflow-hidden">
				<span class="font-mono text-sm font-medium text-white">AI &amp; OUR COMMUNITIES</span>
			</div>
			<h1 class="mt-3 text-center font-sans text-5xl font-extrabold leading-[2.75rem] text-foreground">
				Community Conversations in {region.stateName}
			</h1>
			<p class="mt-4 text-center font-sans text-base font-medium leading-5 text-foreground">
				Join other residents in a 1-1.5 hour conversation about artificial intelligence and what it means for communities throughout {region.stateName}.
			</p>
		</div>

		<!-- Filter Pills -->
		<div class="flex items-center gap-2.5 px-6 pt-4 pb-2 md:px-12 justify-center">
			{#each filters as f (f.value)}
				<button
					onclick={() => (activeFilter = f.value)}
					class="rounded-[20px] px-2 py-0.5 font-mono text-sm font-medium transition-colors overflow-hidden {activeFilter === f.value
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
