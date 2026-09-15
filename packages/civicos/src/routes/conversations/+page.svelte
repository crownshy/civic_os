<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { Button } from '$lib/components/ui';
	import CampaignCard from './CampaignCard.svelte';

	const { data } = $props();

	const campaigns = $derived(data.campaigns);
</script>

<svelte:head>
	<title>Conversations you can join</title>
</svelte:head>

<AppShell border={false}>
	<div class="flex h-full flex-col overflow-y-auto bg-background">
		<div class="flex flex-col items-center px-6 pt-10 pb-2 md:px-12">
			<div class="overflow-hidden rounded-full bg-foreground px-3.5 py-1">
				<span class="font-mono text-sm font-medium text-white">LIVE NOW</span>
			</div>
			<h1
				class="mt-3 text-center font-display text-4xl leading-[1.05] font-medium tracking-display text-foreground md:text-5xl"
			>
				Conversations you can join
			</h1>
			<p
				class="mt-4 max-w-md text-center font-sans text-base leading-5 font-medium text-foreground"
			>
				Every conversation running right now. Pick the one for your community and tell us what you
				think.
			</p>
		</div>

		<div class="flex flex-col gap-3 px-6 py-8 md:px-12">
			{#if campaigns === null}
				<p class="text-center font-sans text-base leading-6 font-medium text-foreground/70">
					We cannot reach the list of conversations right now. Try again in a moment.
				</p>
			{:else if campaigns.length === 0}
				<p class="text-center font-sans text-base leading-6 font-medium text-foreground/70">
					Nothing is running just yet. New conversations open all the time, so it is worth checking
					back.
				</p>
			{:else}
				{#each campaigns as campaign (campaign.id)}
					<CampaignCard {campaign} />
				{/each}
			{/if}
		</div>

		<div class="mt-auto flex justify-center px-6 pt-2 pb-10 md:px-12">
			<Button variant="soft" size="md" href="https://www.bloom-project.org/">BLOOM PROJECT</Button>
		</div>
	</div>
</AppShell>
