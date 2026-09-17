<script lang="ts">
	import ConversationTabSkeleton from './ConversationTabSkeleton.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors c/[slug]/+layout.svelte (header, tab strip) with the destination tab
	// below it. `title` comes from the sidebar's permitted list, which is already
	// in hand, so the heading can switch the instant a Conversation is clicked.
	let { title, tab }: { title: string | null; tab: string } = $props();

	const tabs = [
		{ label: 'Setup', href: 'overview' },
		{ label: 'Open Poll', href: 'open-poll' },
		{ label: 'Events', href: 'events' }
	];
</script>

<div class="flex min-h-0 flex-1 flex-col" aria-busy="true">
	<header
		class="flex flex-col items-start gap-2 border-b border-foreground/30 px-4 py-4 xl:min-h-28 xl:flex-row xl:items-center xl:justify-between xl:gap-4 xl:px-7 xl:py-5"
	>
		{#if title}
			<h1
				class="font-display max-w-full min-w-0 flex-1 text-h3 font-bold text-balance break-words md:text-h2"
			>
				{title}
			</h1>
		{:else}
			<Skeleton class="h-9 w-72 max-w-full md:h-10" />
		{/if}
		<div class="flex w-full min-w-0 items-center gap-2 xl:w-auto" aria-hidden="true">
			<Skeleton class="h-7 w-20 rounded-full" />
			<Skeleton class="h-5 w-56 max-w-full" />
		</div>
	</header>

	<nav
		class="flex flex-nowrap items-center overflow-x-auto border-b border-foreground/30 px-1 font-ui xl:px-4"
		aria-hidden="true"
	>
		{#each tabs as t (t.href)}
			<span
				class={`relative h-12 shrink-0 px-3 py-3 text-body font-medium whitespace-nowrap ${
					tab === t.href ? 'border-b-[3px] border-primary text-primary' : 'text-foreground/50'
				}`}
			>
				{t.label}
			</span>
		{/each}
	</nav>

	<ConversationTabSkeleton {tab} />
</div>
