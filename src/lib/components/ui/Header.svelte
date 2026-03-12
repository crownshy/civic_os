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
	class="shrink-0 overflow-hidden rounded-bl-[20px] rounded-br-[20px] border-b border-white/20 bg-background shadow-[0px_4px_13.8px_0px_rgba(12,34,95,0.25)] {className}"
>
	<!-- Row 1: County name + ABOUT pill or YOU dot -->
	{#if about}
		<AboutBar {countyName} />
	{:else}
		<div class="flex items-center justify-between pr-3.75 pl-6 pt-3.75">
			<span class="font-mono text-sm font-medium text-foreground/80">{countyName.toUpperCase()}</span>
			<span class="flex items-center gap-2">
				<span class="h-3 w-3 rounded-full border border-white bg-background"></span>
				<span class="font-mono text-sm font-medium text-white/80">YOU</span>
			</span>
		</div>
	{/if}

	<!-- Row 2: Scrolling question marquee (optional) -->
	{#if question}
		<div class="overflow-hidden whitespace-nowrap pt-1 pl-3.75">
			<p class="marquee-text pl-3.75 inline-block font-mono text-sm font-medium uppercase text-white">
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
			class="flex w-full items-center gap-3 pr-3.75 pl-6 pt-3.5 pb-5.75"
		>
			<div class="h-10 w-10 shrink-0 rounded-full bg-linear-to-b from-primary to-background"></div>
			<div
				class="flex flex-1  gap-2.5 overflow-hidden rounded-full bg-white/10 px-5 py-2 shadow-[inset_2px_4px_4px_0px_rgba(0,0,0,0.20)] outline-2 outline-white/20"
			>
				<span class="font-sans text-sm font-medium text-white/80">
					What's missing from the conversation?
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
