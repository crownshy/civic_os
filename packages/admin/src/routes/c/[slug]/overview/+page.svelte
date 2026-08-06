<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Trash2 } from '@lucide/svelte';
	import IdentityCard from './IdentityCard.svelte';
	import CoHostsCard from './CoHostsCard.svelte';
	import DemographicsCard from './DemographicsCard.svelte';
	import SetupCard from './SetupCard.svelte';
	import SetupField from './SetupField.svelte';

	let { data } = $props();

	const region = $derived(data.region);
	const conversation = $derived(data.conversation);

	const title = $derived(conversation?.title ?? region.heroHeader);
	const description = $derived(conversation?.description ?? region.contextParagraphs.join('\n\n'));
	const slug = $derived(conversation?.slug ?? region.slug);
	// Host portion of the public URL (strip protocol + any path).
	const baseUrl = $derived(region.shareUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
	const places = $derived(region.stateName ? [region.stateName] : []);

	// Read-only co-hosts from static region data (lead host + coalition partners).
	// Emails aren't in the static config yet, so they show "Not listed" until the
	// real Host model lands (#362, blocked-by #350).
	const cohosts = $derived([
		{ name: region.hostName, website: region.hostUrl, isAdmin: true },
		...region.partners.map((p) => ({ name: p.name, website: p.url }))
	]);
</script>

{#if region}
	<div class="flex-1 overflow-y-auto">
		<div class="flex flex-col gap-6 px-8 py-8">
			<!-- ===== Identity ===== -->
			<IdentityCard {title} {baseUrl} {slug} keyQuestion={region.question} {places} />

			<!-- ===== Co-Hosts ===== -->
			<!-- Read-only from static region data (no Add flow). The add flow is
			     deferred to #362 (blocked-by #350, the Host object). -->
			<CoHostsCard {cohosts} />

			<!-- ===== Demographics ===== -->
			<!-- Presentational: toggles/Add-New don't persist yet. Config storage is
			     #363/#364 (metadata vs table, pending the team decision). -->
			<DemographicsCard />

			<!-- ===== Context for Participants ===== -->
			<!-- PR6 refines copy/labels; FAQ is intentionally skipped per #352. -->
			<SetupCard
				title="Context for Participants"
				subtitle="This will appear on the homepage for this conversation."
			>
				<SetupField label="Basic Description">
					<div class="text-body leading-relaxed whitespace-pre-line">{description}</div>
				</SetupField>
			</SetupCard>

			<!-- Danger zone: not in the Figma refresh and currently non-functional.
			     Kept to avoid dropping an affordance; open question whether to wire
			     (DeleteConversation) or remove. -->
			<Card
				class="bg-destructive/5 border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 rounded-[20px] transition-colors duration-200"
			>
				<div class="flex items-center justify-between gap-3 px-8 py-5">
					<div>
						<div class="text-destructive text-caption font-bold tracking-tight">DANGER ZONE</div>
						<div class="text-muted-foreground text-caption">
							Permanently delete this conversation and all its data.
						</div>
					</div>
					<Button size="sm" variant="destructive-outline">
						<Trash2 class="size-3.5" />
						delete conversation…
					</Button>
				</div>
			</Card>
		</div>
	</div>
{/if}
