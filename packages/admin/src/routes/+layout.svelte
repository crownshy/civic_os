<script lang="ts">
	import '../app.css';
	import { LayoutDashboard, Plus, Menu, PanelLeftClose, PanelLeftOpen, X, LogOut } from '@lucide/svelte';
	import { page } from '$app/state';
	import { REGIONS } from '$lib/config/regions';

	let { children } = $props();

	const isLogin = $derived(page.url.pathname === '/login');

	// Sidebar UI state.
	// `collapsed` toggles icon-rail vs full sidebar on md+.
	// `mobileOpen` controls drawer overlay on < md.
	let collapsed = $state(false);
	let mobileOpen = $state(false);

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

	// Close drawer when route changes
	$effect(() => {
		page.url.pathname;
		mobileOpen = false;
	});
</script>

{#if isLogin}
	{@render children?.()}
{:else}
<div class="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans">
	<!-- Mobile drawer backdrop -->
	{#if mobileOpen}
		<button
			type="button"
			aria-label="Close sidebar"
			class="fixed inset-0 z-30 bg-black/40 md:hidden"
			onclick={() => (mobileOpen = false)}
		></button>
	{/if}

	<aside
		class={[
			'border-border bg-background flex shrink-0 flex-col border-r transition-[width] duration-200',
			// Mobile: fixed drawer
			'fixed inset-y-0 left-0 z-40 md:static',
			mobileOpen ? 'flex w-72 px-3' : 'hidden md:flex',
			// md+ width
			collapsed ? 'md:w-16 md:px-1' : 'md:w-72 md:px-3'
		].join(' ')}
	>
		<div
			class={[
				'border-border flex items-center border-b py-4',
				collapsed && !mobileOpen ? 'justify-center px-0' : 'justify-between gap-2.5 px-1'
			].join(' ')}
		>
			<div class="flex min-w-0 items-center gap-2.5">
				<div
					class="bg-destructive size-8 shrink-0 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"
				></div>
				{#if !collapsed || mobileOpen}
					<span class="truncate text-body font-bold">CivicOS</span>
				{/if}
			</div>

			<!-- Collapse toggle (md+) -->
			{#if !collapsed || mobileOpen}
				<button
					type="button"
					aria-label="Collapse sidebar"
					class="hover:bg-muted/50 hidden rounded-md p-1.5 md:inline-flex"
					onclick={() => (collapsed = true)}
				>
					<PanelLeftClose class="size-4" />
				</button>
			{/if}

			<!-- Close drawer (mobile) -->
			{#if mobileOpen}
				<button
					type="button"
					aria-label="Close sidebar"
					class="hover:bg-muted/50 rounded-md p-1.5 md:hidden"
					onclick={() => (mobileOpen = false)}
				>
					<X class="size-4" />
				</button>
			{/if}
		</div>

		<!-- Expand button shown only when collapsed on md+ -->
		{#if collapsed && !mobileOpen}
			<button
				type="button"
				aria-label="Expand sidebar"
				class="hover:bg-muted/50 mx-auto mt-2 hidden rounded-md p-1.5 md:inline-flex"
				onclick={() => (collapsed = false)}
			>
				<PanelLeftOpen class="size-4" />
			</button>
		{/if}

		<nav class="py-2.5">
			<a
				href="/"
				title="Dashboard"
				class={[
					'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body font-medium',
					onDashboard ? 'bg-muted-foreground/20' : 'hover:bg-muted/50',
					collapsed && !mobileOpen ? 'justify-center px-0' : ''
				].join(' ')}
			>
				<LayoutDashboard class="size-4 shrink-0" />
				{#if !collapsed || mobileOpen}
					<span>Dashboard</span>
				{/if}
			</a>
		</nav>

		{#if !collapsed || mobileOpen}
			<div class="text-muted-foreground px-2.5 py-2 text-caption font-semibold tracking-wider">
				CONVERSATIONS
			</div>
		{/if}

		<div class="border-border flex flex-col gap-0.5 border-b pb-2.5">
			{#each conversations as conv}
				<a
					href={`/c/${conv.slug}/events`}
					title={conv.title}
					class={[
						'flex items-center gap-2 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-2.5 py-2 text-body font-medium',
						currentSlug === conv.slug ? 'bg-muted-foreground/20' : 'hover:bg-muted/50',
						collapsed && !mobileOpen ? 'justify-center px-0' : ''
					].join(' ')}
				>
					<span class={`size-1.5 shrink-0 rounded-full ${statusDot[conv.status]}`}></span>
					{#if !collapsed || mobileOpen}
						<span class="flex-1 truncate">{conv.title}</span>
					{/if}
				</a>
			{/each}
		</div>

		<div class="p-2.5">
			<button
				type="button"
				title="New Conversation"
				class={[
					'bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-[10px] text-body font-medium',
					collapsed && !mobileOpen ? 'size-9 justify-center p-0' : 'p-2'
				].join(' ')}
			>
				<Plus class="size-4 shrink-0" />
				{#if !collapsed || mobileOpen}
					<span class="font-mono">New Conversation</span>
				{/if}
			</button>
		</div>

		<div class="flex-1"></div>

		<div
			class={[
				'border-border flex items-center border-t py-2.5',
				collapsed && !mobileOpen ? 'justify-center px-0' : 'gap-4 px-3.5'
			].join(' ')}
		>
			<div
				class="bg-foreground size-7 shrink-0 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl"
			></div>
			{#if !collapsed || mobileOpen}
				<span class="flex-1 text-body font-medium">Admin</span>
				<form method="POST" action="/logout">
					<button
						type="submit"
						title="Sign out"
						aria-label="Sign out"
						class="hover:bg-muted/50 rounded-md p-1.5"
					>
						<LogOut class="size-4" />
					</button>
				</form>
			{/if}
		</div>
	</aside>

	<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Mobile top bar with hamburger -->
		<div class="border-border flex h-12 items-center gap-2 border-b px-3 md:hidden">
			<button
				type="button"
				aria-label="Open sidebar"
				class="hover:bg-muted/50 rounded-md p-1.5"
				onclick={() => (mobileOpen = true)}
			>
				<Menu class="size-5" />
			</button>
			<span class="text-body font-bold">CivicOS</span>
		</div>

		{@render children?.()}
	</main>
</div>
{/if}
