<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppShell } from '$lib/components/layout';
	import { PillButton, PillInput, MonoLabel, FloatingStatement } from '$lib/components/ui';
	import { county, floatingStatements } from '$lib/data/mock';

	let email = $state('');
	let submitted = $state(false);

	// Statements appear one-by-one
	let visibleCount = $state(0);
	const staggerMs = 600;

	$effect(() => {
		let i = 0;
		const interval = setInterval(() => {
			i++;
			visibleCount = i;
			if (i >= floatingStatements.length) clearInterval(interval);
		}, staggerMs);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<style>
		@keyframes float-drift {
			0% { transform: translateX(var(--start-x)); }
			50% { transform: translateX(var(--end-x)); }
			100% { transform: translateX(var(--start-x)); }
		}
		.floating-stmt {
			animation: float-drift var(--duration) ease-in-out infinite;
		}
	</style>
</svelte:head>

<AppShell>
	<div class="relative flex h-dvh flex-col bg-primary">

		<!-- Back btn -->
		<a
			href={"/demo"}
			class="flex h-10 w-10 items-center justify-center text-white"
			aria-label="Back"
			>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg> 
		</a>

		<!-- Scrollable hero + statements -->
		<div class="flex flex-1 flex-col overflow-y-auto">
			<!-- Hero area -->
			<div class="flex flex-col items-center px-8 pt-20" in:fade={{ duration: 600 }}>
				<h1 class="text-center font-mono text-4xl font-medium text-primary-foreground">
					SHAPE THE CONVERSATION
				</h1>
				<p class="mt-4 text-center font-mono text-2xl font-medium text-primary-foreground">
					ON AI &amp; ONLINE SAFETY
				</p>
			</div>

			<!-- Floating statements — fade in one-by-one, then drift -->
			<div class="relative mt-8 flex flex-col gap-5 overflow-hidden px-4">
				{#each floatingStatements as text, i}
					{#if i < visibleCount}
						<div
							class="floating-stmt overflow-visible max-w-full"
							style="--start-x: {i % 2 === 0 ? '20px' : '-20px'}; --end-x: {i % 2 === 0 ? '-20px' : '20px'}; --duration: {4 + i * 0.8}s;"
							in:fade={{ duration: 500, easing: cubicOut }}
						>
							<FloatingStatement {text} />
						</div>
					{/if}
				{/each}
			</div>

			<!-- Join counter -->
			<div class="mt-auto flex flex-col items-center pb-4 pt-8" in:fade={{ duration: 800, delay: 900 }}>
				<span class="font-mono text-lg font-medium text-primary-foreground">
					JOIN {county.participantCount.toLocaleString()} IN
				</span>
				<span class="font-mono text-2xl font-medium text-primary-foreground">
					{county.name}
				</span>
			</div>
		</div>

		<!-- Sticky bottom input section -->
		{#if !submitted}
			<div class="shrink-0 bg-background px-8 py-8">
				<PillInput
					placeholder="ABC@GMAIL.COM"
					bind:value={email}
					showAvatar
				/>
				<div class="mt-4">
					<PillButton
						variant="filled"
						fullWidth
						onclick={() => (submitted = true)}
					>
						JOIN THE CONVERSATION
					</PillButton>
				</div>
			</div>
		{:else}
			<div class="flex shrink-0 flex-col items-center bg-background px-8 py-8">
				<MonoLabel size="md" variant="primary">CHECK YOUR EMAIL!</MonoLabel>
				<span class="mt-2 text-8xl">💌</span>
			</div>
		{/if}
	</div>
</AppShell>
