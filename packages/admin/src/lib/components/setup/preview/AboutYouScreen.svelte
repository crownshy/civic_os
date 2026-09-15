<script lang="ts">
	import { Check, Plus } from '@lucide/svelte';
	import PreviewInfoBar from './PreviewInfoBar.svelte';
	import type { PreviewCategory } from './categories';

	interface Props {
		placeName: string;
		/**
		 * The categories this Campaign has switched on, in Setup's order. Passed in
		 * rather than hardcoded so turning one off upstairs empties a row here, the
		 * way it does on the real screen.
		 */
		categories: PreviewCategory[];
	}

	let { placeName, categories }: Props = $props();
</script>

<!-- Mock of the About You screen. The first row renders as answered, because a
     Brand's --card and its shadow only show up on that state. -->
<div class="flex h-full flex-col bg-background">
	<PreviewInfoBar {placeName} />

	<div class="flex flex-1 flex-col overflow-y-auto px-5 pt-5">
		<span class="font-mono text-[11px] font-medium text-foreground/80">BEFORE YOU GO...</span>

		<p
			class="mt-3 font-[family-name:var(--font-display)] text-[24px] leading-7 font-medium tracking-[var(--tracking-display)] text-foreground"
		>
			Help {placeName} see itself.
		</p>

		<p class="mt-2 font-sans text-[11px] font-medium text-foreground">
			This conversation is richer when it reflects the full range of {placeName}. Every question is
			optional.
		</p>

		<div class="mt-5 flex flex-col gap-2 pb-6">
			{#each categories as category, i (category.name)}
				<div
					class="relative flex h-12 w-full items-center rounded-[20px] text-left font-sans text-[15px] leading-5 font-bold {i ===
					0
						? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
						: 'bg-secondary/10 text-foreground/70'}"
				>
					<span class="absolute right-12 left-5 truncate">
						{i === 0 ? category.answer : `${category.name}?`}
					</span>
					{#if i === 0}
						<span
							class="absolute right-4 flex size-7 items-center justify-center rounded-full bg-foreground"
						>
							<Check class="size-3 stroke-3 text-card" />
						</span>
					{:else}
						<span
							class="absolute right-4 flex size-7 items-center justify-center rounded-full bg-foreground/40"
						>
							<Plus class="size-3 stroke-3 text-accent" />
						</span>
					{/if}
				</div>
			{:else}
				<p class="font-sans text-[11px] font-medium text-foreground/60">
					No questions switched on, so participants skip this screen.
				</p>
			{/each}
		</div>
	</div>

	<div class="flex shrink-0 items-center px-6 py-6">
		<span
			class="h-12 w-full rounded-full bg-primary pt-3.5 text-center font-mono text-[13px] font-medium text-primary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
		>
			CONTINUE
		</span>
	</div>
</div>
