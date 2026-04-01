<script lang="ts">
	import { onDestroy } from 'svelte';
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';
	import type { RegionConfig } from '$lib/config/regions';
	import InfoBar from './InfoBar.svelte';

	interface Props {
		question: string;
		countyName: string;
		onSubmit?: (text: string, anonymous: boolean) => void;
		onBack?: () => void;
		onShowInstructions?: () => void;
		region: RegionConfig,
		class?: string;
	}

	let {
		question,
		countyName,
		onSubmit,
		onBack,
		onShowInstructions,
		region,
		class: className
	}: Props = $props();

	let text = $state('');
	let anonymous = $state(true);
	let submitted = $state(false);
	let submitTimer: ReturnType<typeof setTimeout>;
	const maxChars = 240;
	const charCount = $derived(text.length);
	const overLimit = $derived(charCount > maxChars);
	const canSubmit = $derived(charCount > 0 && charCount <= maxChars && !submitted);

	function handleSubmit() {
		if (!canSubmit) return;
		submitted = true;
		onSubmit?.(text, anonymous);
		// Show SUBMITTED! for 2s then auto-navigate back
		submitTimer = setTimeout(() => { onBack?.(); }, 2000);
	}

	onDestroy(() => {
		clearTimeout(submitTimer);
	});

</script>

<div class={cn('relative flex h-dvh flex-col bg-background', className)}>
	<div class="flex flex-1 flex-col rounded-bl-[30px] rounded-br-[30px] bg-gradient-primary shadow-[0px_4px_16.6px_0px_rgba(0,0,0,0.20)]">
		<!-- Header -->
		<InfoBar region={region} {countyName} />

		<!-- Question -->
		<div class="px-5 pt-4">
			<p class="font-sans text-3xl font-bold leading-10 text-foreground">
				{question}
			</p>
		</div>

		<!-- Instructions toggle -->
		<div class="px-6 pt-4">
			<button onclick={onShowInstructions} class="font-mono text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
				SHOW INSTRUCTIONS &rarr;
			</button>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="mx-4 mt-4 flex flex-1 flex-col gap-0">
		<!-- White textarea card -->
		<div class="flex flex-1 flex-col overflow-hidden rounded-[20px] bg-card shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)] outline-2 outline-white">
			<textarea
				bind:value={text}
				placeholder="Type here – what do you think?"
				maxlength={maxChars + 10}
				disabled={submitted}
				onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
				class="flex-1 resize-none bg-transparent p-6 font-sans text-2xl font-medium leading-7 text-card-foreground placeholder:text-card-foreground/70 border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 appearance-none"
			></textarea>
			<div class="flex items-center justify-end px-5 pt-2 pb-4">
				<span class={cn('font-mono text-sm font-medium', overLimit ? 'text-destructive' : 'text-card-foreground')}>
					{charCount} / {maxChars} CHAR
				</span>
			</div>
		</div>

		<!-- Submit button -->
		<div class="px-0 pt-4 pb-4">
			{#if submitted}
				<Button variant="primary" fullWidth disabled>
					SUBMITTED!
				</Button>
			{:else}
				<Button type="submit" variant="primary" fullWidth disabled={!canSubmit}>
					SUBMIT
				</Button>
			{/if}
		</div>
		</form>
	</div>

	<!-- Back link — pinned to bottom -->
	<div class="shrink-0 py-5 text-center">
		<Button variant="pill" class="bg-destructive/5 text-destructive" size="sm" onclick={onBack}>
			<span class="text-base font-medium">&lt;&lt; BACK TO THE CONVERSATION</span>
		</Button>
	</div>

</div>
