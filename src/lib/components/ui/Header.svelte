<script lang="ts">
	import AboutBar from './AboutBar.svelte';
	
	interface Props {
		countyName: string;
		question?: string;
		onCompose?: () => void;
		about?: boolean;
		class?: string;
	}

	let {
		countyName,
		question,
		onCompose,
		about = false,
		class: className = ''
	}: Props = $props();
</script>

<header
	class="shrink-0 overflow-hidden rounded-bl-[20px] rounded-br-[20px] border-b border-secondary bg-linear-to-r from-[#FFEDD3] to-[#FFEDD3]/40 {className}"
>
	<!-- Row 1: County name + ABOUT pill or YOU dot -->
	{#if about}
		<AboutBar {countyName} />
	{:else}
		<div class="flex items-center justify-between pr-3.75 pl-6 pt-3.75">
			<span class="font-mono text-sm font-medium text-foreground/70">{countyName.toUpperCase()}</span>
			<span class="flex items-center gap-2">
				<span class="h-3 w-3 rounded-full border border-foreground/20 bg-secondary"></span>
				<span class="font-mono text-sm font-medium text-foreground/80">YOU</span>
			</span>
		</div>
	{/if}

	<!-- Row 2: Scrolling question marquee (optional) -->
	{#if question}
		<div class="overflow-hidden whitespace-nowrap pt-3 pl-3.75">
			<p class="marquee-text pl-3.75 inline-block font-mono text-sm font-medium uppercase text-card-foreground">
				<span>{question}</span>
				<span class="mx-8" aria-hidden="true">·</span>
				<span aria-hidden="true">{question}</span>
				<span class="mx-8" aria-hidden="true">·</span>
			</p>
		</div>
	{/if}

	<!-- Row 3: Compose input-->
	{#if onCompose}
		<button
			onclick={onCompose}
			class="flex w-full items-center gap-3 pr-3.75 pl-6 pt-3.5 pb-3"
		>
			<div
				class="flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-secondary px-5 py-2"
			>
				<span class="text-base font-bold text-secondary-foreground">
					Share your own response...
				</span>
			</div>
		</button>
	{/if}
</header>

<style>
	.marquee-text {
		animation: marquee 18s linear infinite;
	}
	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>
