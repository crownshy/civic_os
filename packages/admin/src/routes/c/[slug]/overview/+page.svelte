<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Trash2, ExternalLink } from '@lucide/svelte';
	import IdentityCard from './IdentityCard.svelte';
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
</script>

{#if region}
	<div class="flex-1 overflow-y-auto">
		<div class="flex flex-col gap-6 px-8 py-8">
			<!-- ===== Identity ===== -->
			<IdentityCard {title} {baseUrl} {slug} keyQuestion={region.question} {places} />

			<!-- ===== Co-Hosts ===== -->
			<!-- Read-only from static region data (no Add flow). PR4 rebuilds this as
			     the full name/website/email table matching the Figma; the add flow is
			     deferred to #362 (blocked-by #350, the Host object). -->
			<SetupCard
				title="Co-Hosts"
				subtitle="The organizations who are stewarding this conversation in your community."
			>
				<div class="flex flex-col divide-y divide-border">
					<div class="flex items-center justify-between gap-4 py-4">
						<a
							href={region.hostUrl}
							target="_blank"
							rel="noopener"
							class="text-primary group inline-flex items-center gap-1 text-body font-bold underline-offset-2 hover:underline"
						>
							{region.hostName}
							<ExternalLink class="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
						</a>
					</div>
					{#each region.partners as p (p.url)}
						<div class="flex items-center justify-between gap-4 py-4">
							<a
								href={p.url}
								target="_blank"
								rel="noopener"
								class="text-body font-bold underline-offset-2 hover:underline"
							>
								{p.name}
							</a>
						</div>
					{/each}
				</div>
			</SetupCard>

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
