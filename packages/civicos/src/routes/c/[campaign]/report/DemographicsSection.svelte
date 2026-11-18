<script lang="ts">
	import Badge from '@civicos/shared/ui/Badge.svelte';
	import type { ParticipationReport } from '@civicos/shared/data/demographics';
	import PanelCard from '$lib/components/ui/PanelCard.svelte';
	import SectionContent from './SectionContent.svelte';

	interface Props {
		demographics: ParticipationReport | null;
	}

	let { demographics }: Props = $props();
</script>

<section class="relative overflow-hidden bg-background py-6">
	<SectionContent>
		<div class="px-6">
			<Badge variant="soft" size="lg">DEMOGRAPHICS</Badge>
		</div>
		<div class="mt-8 px-8">
			<h2 class="font-display text-3xl leading-8 font-medium tracking-display text-foreground">
				This Open Poll engaged people of different backgrounds.
			</h2>
		</div>
		<PanelCard bg="bg-card" borderClass="border border-border" class="mx-6 mt-10">
			<p class="px-6 py-8 font-sans text-base text-muted-foreground">
				{#if demographics}
					Detailed demographic breakdowns are temporarily unavailable.
				{:else}
					Demographic data is unavailable. Please try again later.
				{/if}
			</p>
		</PanelCard>
	</SectionContent>
</section>
