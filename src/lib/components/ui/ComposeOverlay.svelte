<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		question: string;
		countyName: string;
		onSubmit?: (text: string, anonymous: boolean) => void;
		onBack?: () => void;
		class?: string;
	}

	let {
		question,
		countyName,
		onSubmit,
		onBack,
		class: className
	}: Props = $props();

	let text = $state('');
	let anonymous = $state(true);
	const maxChars = 240;
	const charCount = $derived(text.length);
	const canSubmit = $derived(charCount > 0 && charCount <= maxChars);
</script>

<div class={cn('flex h-dvh flex-col bg-background', className)}>
	<!-- Blue card area -->
	<div class="flex flex-1 flex-col rounded-[30px] bg-primary shadow-lg">
		<!-- Header -->
		<div class="flex items-center justify-between px-8 pt-6">
			<span class="font-mono text-sm font-medium text-primary-foreground">{countyName}</span>
			<span class="flex items-center gap-2">
				<span class="h-3 w-3 rounded-full border border-primary-foreground bg-primary-foreground"></span>
				<span class="font-mono text-sm font-medium text-primary-foreground">YOU</span>
			</span>
		</div>

		<!-- Share your thoughts label -->
		<div class="px-8 pt-6">
			<span class="font-mono text-lg font-medium leading-5 text-primary-foreground">
				SHARE YOUR THOUGHTS:
			</span>
		</div>

		<!-- Question -->
		<div class="px-8 pt-2">
			<p class="font-mono text-3xl font-medium leading-9 text-primary-foreground">
				{question}
			</p>
		</div>

		<!-- Instructions toggle -->
		<div class="px-8 pt-4">
			<span class="font-mono text-sm font-medium text-primary-foreground/80">
				SHOW INSTRUCTIONS &rarr;
			</span>
		</div>

		<!-- White textarea card -->
		<div class="mx-4 mt-4 flex flex-1 flex-col overflow-hidden rounded-3xl bg-background shadow-lg outline-2 outline-background">
			<textarea
				bind:value={text}
				placeholder="TYPE HERE – WHAT DO YOU THINK?"
				maxlength={maxChars}
				class="flex-1 resize-none bg-transparent p-6 font-mono text-2xl font-medium leading-7 text-primary placeholder:text-primary/70 border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 appearance-none"			></textarea>
			<div class="flex items-center gap-2 px-4 pt-2 pb-4">
				<span class="font-mono text-sm font-medium text-primary">{charCount} / {maxChars} CHAR</span>
				<button
					onclick={() => (anonymous = !anonymous)}
					class="ml-4 flex items-center gap-2"
				>
					<span
						class={cn(
							'flex h-5 w-5 items-center justify-center rounded-full',
							anonymous ? 'bg-primary' : 'border-2 border-primary bg-transparent'
						)}
					>
						{#if anonymous}
							<svg class="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</span>
					<span class="font-mono text-sm font-medium text-primary">SUBMIT ANONYMOUSLY</span>
				</button>
			</div>
		</div>

		<!-- Submit button -->
		<div class="p-4">
			<button
				disabled={!canSubmit}
				onclick={() => onSubmit?.(text, anonymous)}
				class={cn(
					'flex w-full items-center justify-center rounded-full px-7 py-3.5 font-mono text-2xl font-medium transition-colors',
					canSubmit
						? 'bg-teal-400 text-primary-foreground'
						: 'bg-white/20 text-white/70 outline outline-2 outline-white/70'
				)}
			>
				SUBMIT
			</button>
		</div>
	</div>

	<!-- Back link -->
	<div class="shrink-0 py-4">
		<button
			onclick={onBack}
			class="w-full text-center font-mono text-lg font-medium text-primary/70"
		>
			&larr; BACK TO THE CONVERSATION
		</button>
	</div>
</div>
