<script lang="ts">
	import '../app.css';
	import { LayoutDashboard, Plus } from '@lucide/svelte';
	import { page } from '$app/state';
	import { REGIONS } from '@civicos/shared/data/regions';

	let { children } = $props();

	// Build sidebar list from real region data. Status dot: green if active
	// conversation, red if explicitly closed, gray for testing/dev.
	const conversations = $derived(
		Object.values(REGIONS).map((r) => {
			const status: 'live' | 'idle' | 'draft' =
				r.slug === 'testing' || r.slug === 'dev'
					? 'idle'
					: r.conversationsActive === false
						? 'draft'
						: 'live';
			return { slug: r.slug, title: r.heroHeader, status };
		})
	);

	const statusDot: Record<'live' | 'idle' | 'draft', string> = {
		live: 'bg-primary',
		idle: 'bg-muted-foreground/30',
		draft: 'bg-destructive'
	};

	const onDashboard = $derived(page.url.pathname === '/');
	const currentSlug = $derived(page.params.slug);
</script>

<div class="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans">
	<aside class="border-border bg-background flex w-56 shrink-0 flex-col border-r">
		<div class="border-border flex items-center gap-2.5 border-b p-4">
			<div
				class="bg-destructive size-8 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"
			></div>
			<span class="text-sm font-bold">CivicOS</span>
		</div>

		<nav class="py-2.5">
			<a
				href="/"
				class={`flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium ${onDashboard ? 'bg-muted-foreground/20' : 'hover:bg-muted/50'}`}
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
					href={`/c/${conv.slug}/events`}
					class={`flex items-center gap-2 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-2.5 py-2 text-sm font-medium ${
						currentSlug === conv.slug ? 'bg-muted-foreground/20' : 'hover:bg-muted/50'
					}`}
				>
					<span class={`size-1.5 rounded-full ${statusDot[conv.status]}`}></span>
					<span class="flex-1 truncate">{conv.title}</span>
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
			<div
				class="bg-foreground size-7 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"
			></div>
			<span class="text-sm font-medium">Admin</span>
		</div>
	</aside>

	<main class="flex flex-1 flex-col overflow-hidden">
		{@render children?.()}
	</main>
</div>
