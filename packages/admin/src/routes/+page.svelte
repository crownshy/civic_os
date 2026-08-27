<script lang="ts">
	import { ArrowRight, CalendarDays } from '@lucide/svelte';
	import type { ConversationStatus } from '$lib/conversations';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const statusLabel: Record<ConversationStatus, string> = {
		live: 'Live',
		draft: 'Draft',
		complete: 'Closed'
	};

	const statusClass: Record<ConversationStatus, string> = {
		live: 'bg-success text-success-foreground',
		draft: 'bg-primary/10 text-primary',
		complete: 'bg-muted text-muted-foreground'
	};
</script>

<div class="p-6 sm:p-8">
	<h1 class="mb-1 text-section font-bold">Dashboard</h1>
	<p class="mb-8 text-body text-muted-foreground">Select a conversation to manage.</p>

	{#if data.conversationsError}
		<p class="text-body text-destructive">
			We could not load your Campaigns: {data.conversationsError} This is not an empty account.
		</p>
	{:else if data.conversations.length === 0}
		<p class="text-body text-muted-foreground">
			No conversations yet. Ones your organization owns or co-hosts will show up here.
		</p>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.conversations as conv (conv.id)}
				<a
					href={resolve('/c/[slug]/overview', { slug: conv.slug })}
					class="group flex flex-col gap-4 rounded-xl border border-border p-5 transition-colors hover:border-foreground/20 hover:bg-muted/30"
				>
					<div class="flex items-start justify-between gap-2">
						<span
							class={`shrink-0 rounded px-1.5 py-0.5 text-caption font-semibold ${statusClass[conv.status]}`}
						>
							{statusLabel[conv.status]}
						</span>
						<ArrowRight
							class="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
						/>
					</div>

					<div class="min-w-0 flex-1">
						<p class="truncate text-body leading-snug font-semibold">{conv.title}</p>
						{#if conv.placeName}
							<p class="mt-0.5 text-body text-muted-foreground">{conv.placeName}</p>
						{/if}
					</div>

					{#if conv.eventCount > 0}
						<div class="flex items-center gap-1.5 text-caption text-muted-foreground">
							<CalendarDays class="size-3.5 shrink-0" />
							<span>{conv.eventCount} event{conv.eventCount === 1 ? '' : 's'}</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
