<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve --
	   The href is absolute and cross-origin by construction: a Campaign published
	   to a Place is served only from that Place's subdomain. `resolve()` would
	   rewrite it against this host, the one host it is known not to be on. */
	import { cn } from '$lib/utils';
	import ArrowRight from '$lib/assets/icons/arrow-right.svelte';
	import type { DirectoryEntry } from '$lib/config/directory';

	interface Props {
		campaign: DirectoryEntry;
		class?: string;
	}

	let { campaign, class: className }: Props = $props();
</script>

<a
	href={campaign.url}
	class={cn(
		'group relative flex items-center overflow-hidden rounded-[20px] bg-card px-6 py-5 shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_0px_rgba(12,34,95,0.2)]',
		className
	)}
>
	<div class="min-w-0 flex-1 pr-7">
		{#if campaign.place}
			<p class="font-mono text-sm font-medium tracking-wide text-primary uppercase">
				{campaign.place.name}
			</p>
		{/if}

		<h2 class="mt-1 font-display text-2xl leading-7 font-medium tracking-display text-foreground">
			{campaign.title}
		</h2>

		{#if campaign.description}
			<p class="mt-2 font-sans text-base leading-5 font-medium text-foreground/70">
				{campaign.description}
			</p>
		{/if}
	</div>

	<div class="absolute inset-y-0 right-0 flex items-center pr-5">
		<ArrowRight />
	</div>
</a>
