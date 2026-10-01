<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { Button } from '$lib/components/ui';
	import CampaignCard from '$lib/components/ui/CampaignCard.svelte';
	import type { DirectoryEntry } from '$lib/config/directory';

	// A Place's page: the Campaigns running there (ADR 0014). A Place is not a
	// record (ADR 0006), so this is the directory filtered to its slug.
	let { placeName, campaigns }: { placeName: string; campaigns: DirectoryEntry[] } = $props();
</script>

<svelte:head>
	<title>Conversations in {placeName}</title>
</svelte:head>

<AppShell border={false}>
	<div class="flex h-full flex-col overflow-y-auto bg-background">
		<div class="flex flex-col items-center px-6 pt-10 pb-2 md:px-12">
			<div class="overflow-hidden rounded-full bg-foreground px-3.5 py-1">
				<span class="font-mono text-sm font-medium text-white uppercase">{placeName}</span>
			</div>
			<h1
				class="mt-3 text-center font-display text-4xl leading-[1.05] font-medium tracking-display text-foreground md:text-5xl"
			>
				Conversations in {placeName}
			</h1>
			<p
				class="mt-4 max-w-md text-center font-sans text-base leading-5 font-medium text-foreground"
			>
				Every conversation running here right now. Pick one and tell us what you think.
			</p>
		</div>

		<div class="flex flex-col gap-3 px-6 py-8 md:px-12">
			{#each campaigns as campaign (campaign.id)}
				<CampaignCard {campaign} />
			{/each}
		</div>

		<div class="mt-auto flex justify-center px-6 pt-2 pb-10 md:px-12">
			<Button variant="soft" size="md" href="/conversations">SEE ALL CONVERSATIONS</Button>
		</div>
	</div>
</AppShell>
