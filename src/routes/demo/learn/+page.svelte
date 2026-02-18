<script lang="ts">
	import { onDestroy } from 'svelte';
	import { AppShell, AppHeader } from '$lib/components/layout';
	import { PillButton, MonoLabel, QuoteText, ProgressBar } from '$lib/components/ui';
	import { county, deliberation, learningCards, themeSummaries } from '$lib/data/mock';

	let currentCard = $state(0);
	let countdown = $state(5);
	let timer: ReturnType<typeof setInterval> | null = null;

	const card = $derived(learningCards[currentCard]);

	function startCountdown() {
		countdown = 5;
		if (timer) clearInterval(timer);
		timer = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				if (timer) clearInterval(timer);
				timer = null;
			}
		}, 1000);
	}

	startCountdown();

	function nextCard() {
		if (currentCard < learningCards.length - 1) {
			currentCard++;
		} else {
			currentCard = 0;
		}
		startCountdown();
	}

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<AppShell>
	<div class="flex h-dvh flex-col bg-primary">
		<!-- Header with question (fixed) -->
		<AppHeader
			countyName={county.name}
			question={deliberation.question}
			variant="on-primary"
			backHref="/demo"
			class="shrink-0 border-b border-primary-foreground/20"
		/>

		<!-- Scrollable card content -->
		<div class="flex flex-1 flex-col overflow-y-auto px-8 pt-6">
			<MonoLabel size="md" variant="white">{card.label}</MonoLabel>

			{#if card.type === 'did-you-know'}
				<QuoteText size="lg" variant="white" class="mt-4">
					{card.body}
				</QuoteText>
			{:else if card.type === 'where-were-at'}
				<QuoteText size="lg" variant="white" class="mt-4">
					{card.title}
				</QuoteText>
				<div class="mt-8 flex flex-col gap-4">
					{#each themeSummaries as theme}
						<ProgressBar
							percentage={theme.percentage}
							variant="on-primary"
						/>
					{/each}
				</div>
			{:else if card.type === 'testimony'}
				<div class="mt-4 flex-1">
					<img
						src={card.imageUrl}
						alt="Testimony"
						class="h-full w-full rounded-lg object-cover opacity-50"
					/>
				</div>
			{/if}
		</div>

		<!-- Sticky bottom actions -->
		<div class="flex shrink-0 flex-col gap-3 border-t border-primary-foreground/10 px-8 pb-8 pt-4 w-full">
			<PillButton
				variant="ghost"
				fullWidth
				disabled={countdown > 0}
				onclick={nextCard}
			>
				{#if countdown > 0}
					CONTINUE IN {countdown}...
				{:else}
					CONTINUE
				{/if}
			</PillButton>
			<PillButton variant="filled-white" fullWidth>
				LEARN MORE
			</PillButton>
		</div>
	</div>
</AppShell>
