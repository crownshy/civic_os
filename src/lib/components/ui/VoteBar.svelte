<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		onAgree?: () => void;
		onDisagree?: () => void;
		onSkip?: () => void;
		onEnd?: () => void;
		current?: number;
		total?: number;
		class?: string;
	}

	let {
		onAgree,
		onDisagree,
		onSkip,
		onEnd,
		current = 0,
		total = 10,
		class: className
	}: Props = $props();

	const remaining = $derived(total - current);
	const showDots = $derived(total <= 20);
</script>

<div class={cn('overflow-hidden bg-background', className)}>
	<!-- Top info row -->
	<div class="flex items-center">
		<!-- YYour vote tab -->
		<div class="flex h-12 items-center rounded-tr-[20px] bg-primary px-4">
			<span class="font-mono text-sm font-medium text-primary-foreground">YOUR VOTE</span>
		</div>

		<!-- Counter / progress dots -->
		<div class="flex flex-1 items-center gap-2 px-3">
			<span class="font-mono text-sm font-medium text-primary">
				{#if showDots}
					{current}/{total}
				{:else}
					{remaining} REMAINING
				{/if}
			</span>

			{#if showDots}
				<div class="flex items-center gap-1.5">
					{#each Array(total) as _, i}
						<span
							class={cn(
								'h-2.5 w-2.5 rounded-full border-2 border-primary',
								i < current ? 'bg-primary' : 'bg-transparent'
							)}
						></span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- END link -->
		<button
			onclick={onEnd}
			class="px-4 font-mono text-sm font-medium text-accent-pink hover:opacity-80"
		>
			END
		</button>
	</div>

	<!-- Vote buttons row -->
	<div class="flex items-center gap-3.5 bg-primary px-7 py-5">
		<button
			onclick={onAgree}
			class="flex h-14 flex-1 items-center justify-center rounded-full bg-background font-mono text-lg font-medium text-primary"
		>
			AGREE
		</button>
		<button
			onclick={onDisagree}
			class="flex h-14 flex-1 items-center justify-center rounded-full border-2 border-primary-foreground bg-primary font-mono text-lg font-medium text-primary-foreground"
		>
			DISAGREE
		</button>
		<button
			aria-label="Skip"
			onclick={onSkip}
			class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground bg-primary"
		>
			<svg class="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
			</svg>
		</button>
	</div>
</div>
