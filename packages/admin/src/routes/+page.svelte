<script lang="ts">
	import { ArrowRight, CalendarDays } from '@lucide/svelte';

	let { data } = $props();

	const statusLabel: Record<'live' | 'idle' | 'draft', string> = {
		live: 'Live',
		idle: 'Dev',
		draft: 'Offline'
	};

	const statusClass: Record<'live' | 'idle' | 'draft', string> = {
		live: 'bg-success text-success-foreground',
		idle: 'bg-muted text-muted-foreground',
		draft: 'bg-primary/10 text-primary'
	};
</script>

<div class="p-6 sm:p-8">
	<h1 class="mb-1 text-section font-bold">Dashboard</h1>
	<p class="text-muted-foreground mb-8 text-body">Select a conversation to manage.</p>

	{#if data.conversations.length === 0}
		<p class="text-muted-foreground text-body">No conversations configured.</p>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.conversations as conv (conv.slug)}
				<a
					href={`/c/${conv.slug}/overview`}
					class="border-border hover:border-foreground/20 hover:bg-muted/30 group flex flex-col gap-4 rounded-xl border p-5 transition-colors"
				>
					<div class="flex items-start justify-between gap-2">
						<span
							class={`shrink-0 rounded px-1.5 py-0.5 text-caption font-semibold ${statusClass[conv.status]}`}
						>
							{statusLabel[conv.status]}
						</span>
						<ArrowRight
							class="text-muted-foreground group-hover:text-foreground mt-0.5 size-4 shrink-0 transition-colors"
						/>
					</div>

					<div class="min-w-0 flex-1">
						<p class="truncate text-body font-semibold leading-snug">{conv.title}</p>
						<p class="text-muted-foreground mt-0.5 text-body">{conv.stateName}</p>
					</div>

					{#if conv.eventCount > 0}
						<div class="text-muted-foreground flex items-center gap-1.5 text-caption">
							<CalendarDays class="size-3.5 shrink-0" />
							<span>{conv.eventCount} event{conv.eventCount === 1 ? '' : 's'}</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
