<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Trash2, ExternalLink } from '@lucide/svelte';

	let { data } = $props();

	const region = $derived(data.region);
	const conversation = $derived(data.conversation);

	const title = $derived(conversation?.title ?? region.heroHeader);
	const description = $derived(conversation?.description ?? region.contextParagraphs.join('\n\n'));
	const slug = $derived(conversation?.slug ?? region.slug);
</script>

{#if region}
	<div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
		<h2 class="text-body font-bold">Settings</h2>

		<div class="space-y-1">
			<label class="text-muted-foreground text-caption tracking-tight">SLUG</label>
			<Card
				class="hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors duration-150"
			>
				<div class="px-3 py-3 text-caption">{slug}</div>
			</Card>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-caption tracking-tight">TITLE</label>
			<Card
				class="hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors duration-150"
			>
				<div class="px-3 py-3 text-body">{title}</div>
			</Card>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-caption tracking-tight">KEY QUESTION</label>
			<Card
				class="hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors duration-150"
			>
				<div class="px-3 py-3 text-body">{region.question}</div>
			</Card>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-caption tracking-tight">CONTEXT</label>
			<Card
				class="hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors duration-150"
			>
				<div class="px-3 py-3 text-body leading-relaxed whitespace-pre-line">{description}</div>
			</Card>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-caption tracking-tight">HOST</label>
			<Card
				class="hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors duration-150"
			>
				<div class="px-3 py-3 text-body">
					<a
						href={region.hostUrl}
						class="text-primary group inline-flex items-center gap-1 underline-offset-2 hover:underline"
						target="_blank"
						rel="noopener"
					>
						{region.hostName}
						<ExternalLink class="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
					</a>
				</div>
			</Card>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-caption tracking-tight"
				>PARTNERS ({region.partners.length})</label
			>
			<Card
				class="hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors duration-150"
			>
				<div class="flex flex-wrap gap-2 px-3 py-3 text-caption">
					{#each region.partners as p (p.url)}
						<a
							href={p.url}
							target="_blank"
							rel="noopener"
							class="bg-muted-foreground/10 hover:bg-muted-foreground/20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-all hover:scale-105 active:scale-95"
						>
							{p.name}
						</a>
					{/each}
				</div>
			</Card>
		</div>

		<div class="border-border my-4 border-t"></div>

		<Card
			class="bg-destructive/5 border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 transition-colors duration-200"
		>
			<div class="flex items-center justify-between gap-3 px-4 py-3.5">
				<div>
					<div class="text-destructive text-caption font-bold tracking-tight">DANGER ZONE</div>
					<div class="text-muted-foreground text-caption">
						Permanently delete this conversation and all its data.
					</div>
				</div>
				<Button
					size="sm"
					variant="outline"
					class="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full bg-card transition-all hover:scale-105 active:scale-95"
				>
					<Trash2 class="size-3.5" />
					delete conversation…
				</Button>
			</div>
		</Card>
	</div>
{/if}
