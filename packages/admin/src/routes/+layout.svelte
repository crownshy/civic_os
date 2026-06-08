<script lang="ts">
	import '../app.css';
	import { LayoutDashboard, Plus } from '@lucide/svelte';

	let { children } = $props();

	const conversations = [
		{ slug: 'ai-and-our-communities', title: 'AI & Our Communities', status: 'live' as const },
		{ slug: 'data-centers', title: 'Data Centers and Us', status: 'idle' as const },
		{ slug: 'future-of-ousd', title: 'Future of OUSD', status: 'live' as const },
		{ slug: 'bushrod-park', title: 'Improving Bushrod Park', status: 'draft' as const }
	];

	const statusDot: Record<'live' | 'idle' | 'draft', string> = {
		live: 'bg-primary',
		idle: 'bg-muted-foreground/30',
		draft: 'bg-destructive'
	};
</script>

<div class="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans">
	<aside class="border-border bg-background flex w-56 shrink-0 flex-col border-r">
		<div class="border-border flex items-center gap-2.5 border-b p-4">
			<div class="bg-destructive size-8 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"></div>
			<span class="text-sm font-bold">CivicOS</span>
		</div>

		<nav class="py-2.5">
			<a
				href="/"
				class="bg-muted-foreground/20 flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium"
			>
				<LayoutDashboard class="size-4" />
				<span>Dashboard</span>
			</a>
		</nav>

		<div class="text-muted-foreground px-2.5 py-2 text-[10px] font-semibold tracking-wider">
			CONVERSATIONS
		</div>

		<div class="border-border flex flex-col gap-0.5 border-b pb-2.5">
			{#each conversations as conv}
				<a
					href={`/c/${conv.slug}`}
					class="hover:bg-muted/50 flex items-center gap-2 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-2.5 py-2 text-sm font-medium"
				>
					<span class={`size-1.5 rounded-full ${statusDot[conv.status]}`}></span>
					<span class="flex-1">{conv.title}</span>
				</a>
			{/each}
		</div>

		<div class="p-2.5">
			<button
				type="button"
				class="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-[10px] p-2 text-sm font-medium"
			>
				<Plus class="size-4" />
				<span class="font-mono">New Conversation</span>
			</button>
		</div>

		<div class="flex-1"></div>

		<div class="border-border flex items-center gap-4 border-t px-3.5 py-2.5">
			<div class="bg-foreground size-7 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"></div>
			<span class="text-sm font-medium">Admin</span>
		</div>
	</aside>

	<main class="flex flex-1 flex-col overflow-hidden">
		{@render children?.()}
	</main>
</div>
