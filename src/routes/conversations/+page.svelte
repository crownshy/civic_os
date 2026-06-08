<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { InfoBar, ConversationEventCard, Button } from '$lib/components/ui';
	import { Input } from '$lib/components/ui/input';
	import type { RegionConfig } from '$lib/config/regions';
	import { session } from '$lib/services/session.svelte';
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { cubicOut, backOut } from 'svelte/easing';
	import { Mail } from 'lucide-svelte';
	import { isBefore, addHours } from 'date-fns';

	const region: RegionConfig = page.data.region;

	const conversationsActive = region.conversationsActive !== false;

	type Filter = 'all' | 'online' | 'in-person';
	let activeFilter: Filter = $state('all');

	const filters: { label: string; value: Filter }[] = [
		{ label: 'ALL', value: 'all' },
		{ label: 'ONLINE', value: 'online' },
		{ label: 'IN PERSON', value: 'in-person' }
	];

	const filtered = $derived(
		(activeFilter === 'all'
			? region.events
			: region.events.filter((e) => e.format === activeFilter)
		)
			.filter((e) => !isBefore(addHours(new Date(e.date), 2), new Date()))
			.toSorted((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	);

	let email = $state('');
	let submitting = $state(false);

	async function handleSignUp() {
		const trimmed = email.trim();
		if (!trimmed) return;
		submitting = true;
		await session.registerEmail(trimmed);
		submitting = false;
	}
</script>

<AppShell>
	<div class="flex h-full flex-col overflow-y-auto bg-gradient-primary">
		<InfoBar countyName={region.stateName} {region} />

		<!-- Header -->
		<div class="flex flex-col items-center px-6 pt-6 pb-0 md:px-12">
			<div class="overflow-hidden rounded-full bg-foreground px-3.5 py-1">
				<span class="font-mono text-sm font-medium text-white">AI &amp; OUR COMMUNITIES</span>
			</div>
			<h1
				class="mt-3 text-center font-display text-5xl leading-[2.75rem] font-medium tracking-display text-foreground"
			>
				Conversations in {region.stateName}
			</h1>
			<p class="mt-4 text-center font-sans text-base leading-5 font-medium text-foreground">
				Join other residents in a 60-90 minute conversation about artificial intelligence and what
				it means for communities throughout {region.stateName}.
			</p>
		</div>

		{#if conversationsActive}
			<!-- Filter Pills -->
			<div class="flex items-center justify-center gap-2.5 px-6 pt-4 pb-2 md:px-12">
				{#each filters as f (f.value)}
					<button
						onclick={() => (activeFilter = f.value)}
						class="overflow-hidden rounded-[20px] px-2 py-0.5 font-mono text-sm font-medium transition-colors {activeFilter ===
						f.value
							? 'bg-foreground text-white'
							: 'bg-secondary/10 text-foreground/50'}"
					>
						{f.label}
					</button>
				{/each}
			</div>

			<!-- Conversation Cards -->
			<div class="flex flex-col gap-4 px-7 pt-4 pb-8 md:px-12">
				{#each filtered as event, i (event.slug)}
					<a
						href="/conversations/{event.slug}"
						class="block transition-transform active:scale-[0.98]"
						in:fly={{ y: 30, duration: 350, delay: i * 80, easing: backOut }}
						out:fade={{ duration: 200 }}
						animate:flip={{ duration: 300, easing: cubicOut }}
					>
						<ConversationEventCard {event} />
					</a>
				{/each}
			</div>
		{:else}
			<!-- Coming Soon: email capture -->
			<div class="mt-6 bg-card/30 px-6 py-8 md:px-12">
				<div class="mx-auto flex max-w-md flex-col gap-4">
					{#if session.emailProvided}
						<p
							class="text-center font-sans text-base leading-6 text-muted-foreground"
							in:fade={{ duration: 400, delay: 300 }}
						>
							<strong>Received! We'll be in touch.</strong>
						</p>
					{:else}
						<h2
							class="text-center font-display text-3xl leading-8 font-medium tracking-display text-muted-foreground"
						>
							Coming Soon
						</h2>
						<p class="text-center font-sans text-base leading-6 font-medium text-muted-foreground">
							Share your email to get notified when live conversations are open for {region.stateName}.
						</p>
						<div class="flex flex-col gap-3.5">
							<form
								onsubmit={(e) => {
									e.preventDefault();
									handleSignUp();
								}}
								class="flex w-full items-center rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
							>
								<Mail class="size-4 shrink-0 text-muted-foreground/60" />
								<Input
									bind:value={email}
									type="email"
									placeholder="email@xyz.com"
									disabled={submitting}
									class="ml-2.5 h-8 flex-1 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-muted-foreground shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
								/>
							</form>
							<Button
								variant="primary"
								fullWidth
								disabled={!email.trim() || submitting}
								onclick={handleSignUp}
							>
								SIGN UP FOR UPDATES
							</Button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</AppShell>
