<script lang="ts">
	import { TEXT_LIMITS, toOneLine } from '@civicos/shared/data/text-limits';
	import { onDestroy } from 'svelte';
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';
	import InfoBar from './InfoBar.svelte';
	import AlertBanner from './AlertBanner.svelte';

	interface Props {
		question: string;
		placeName: string;
		/** Resolves to false when the statement did not go in, so the text stays for a retry. */
		onSubmit?: (text: string) => Promise<boolean> | boolean | void;
		onBack?: () => void;
		onShowInstructions?: () => void;
		class?: string;
	}

	let {
		question,
		placeName,
		onSubmit,
		onBack,
		onShowInstructions,
		class: className
	}: Props = $props();

	let text = $state('');
	let submitted = $state(false);
	let sending = $state(false);
	let failed = $state(false);
	let submitTimer: ReturnType<typeof setTimeout>;
	// Shared with admin's seed statements, so a seed reads like any other statement.
	const maxChars = TEXT_LIMITS.statement;
	// Counted and sent trimmed, like admin's seeds, so spaces alone are not a
	// statement and trailing ones do not count against the limit.
	const trimmed = $derived(text.trim());
	const charCount = $derived(trimmed.length);
	const overLimit = $derived(charCount > maxChars);
	const canSubmit = $derived(charCount > 0 && charCount <= maxChars && !submitted && !sending);

	async function handleSubmit() {
		if (!canSubmit) return;
		sending = true;
		failed = false;
		const ok = (await onSubmit?.(trimmed)) !== false;
		sending = false;
		if (!ok) {
			failed = true;
			return;
		}
		submitted = true;
		// Show SUBMITTED! for 2s then auto-navigate back
		submitTimer = setTimeout(() => {
			onBack?.();
		}, 2000);
	}

	onDestroy(() => {
		clearTimeout(submitTimer);
	});
</script>

<div class={cn('relative flex h-dvh flex-col bg-background', className)}>
	<!-- Header -->
	<InfoBar {placeName} />

	<!-- Question -->
	<div class="px-5 pt-4">
		<p class="font-display text-3xl leading-10 font-medium tracking-display text-foreground">
			{question}
		</p>
	</div>

	<!-- Instructions toggle -->
	<div class="px-6 pt-4">
		<button
			onclick={onShowInstructions}
			class="font-mono text-sm font-medium text-foreground/80 transition-all hover:text-foreground active:text-foreground active:opacity-60"
		>
			SHOW INSTRUCTIONS &rarr;
		</button>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="mx-4 mt-4 flex flex-1 flex-col gap-0"
	>
		<!-- White textarea card -->
		<div
			class="flex flex-1 flex-col overflow-hidden rounded-[20px] bg-card shadow-[0px_10px_15px_0px_rgba(12,34,95,0.25)] outline-2 outline-white"
		>
			<textarea
				bind:value={text}
				placeholder="Type here – what do you think?"
				disabled={submitted || sending}
				oninput={() => {
					failed = false;
					// A pasted line break; Enter itself never gets this far.
					if (/[\r\n]/.test(text)) text = toOneLine(text);
				}}
				onkeydown={(e) => {
					// Statements are one line (#465): Enter submits, Shift+Enter does nothing.
					if (e.key === 'Enter') {
						e.preventDefault();
						if (!e.shiftKey) handleSubmit();
					}
				}}
				class="flex-1 resize-none appearance-none border-0 bg-transparent p-6 font-sans text-2xl leading-7 font-medium text-card-foreground outline-none placeholder:text-card-foreground/70 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
			></textarea>
			<div class="flex items-center justify-end px-5 pt-2 pb-4">
				<span
					class={cn(
						'font-mono text-sm font-medium',
						overLimit ? 'text-destructive' : 'text-card-foreground'
					)}
				>
					{charCount} / {maxChars} CHAR{#if overLimit}, {charCount - maxChars} OVER{/if}
				</span>
			</div>
		</div>

		{#if failed}
			<AlertBanner class="mt-4" message="Your statement didn't go through. Please try again." />
		{/if}

		<!-- Buttons -->
		<div class="flex gap-3 pt-8 pb-4">
			<Button variant="destructive" data-umami-event="compose-back" class="flex-1" onclick={onBack}>
				GO BACK
			</Button>
			{#if submitted}
				<Button variant="primary" class="flex-1" disabled>SUBMITTED!</Button>
			{:else}
				<Button
					type="submit"
					data-umami-event="compose-submit"
					variant="primary"
					class="flex-1"
					disabled={!canSubmit}
				>
					{sending ? 'SENDING…' : 'SUBMIT'}
				</Button>
			{/if}
		</div>
	</form>
</div>
