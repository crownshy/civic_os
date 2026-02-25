<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		countyName: string;
		showUser?: boolean;
		question?: string;
		title?: string;
		variant?: 'on-primary' | 'on-white';
		compact?: boolean;
		rounded?: boolean;
		shareInput?: boolean;
		onShareClick?: () => void;
		class?: string;
	}

	let {
		countyName,
		showUser = true,
		question,
		title,
		variant = 'on-primary',
		compact = false,
		rounded = false,
		shareInput = false,
		onShareClick,
		class: className
	}: Props = $props();

	const isPrimary = $derived(variant === 'on-primary');
</script>

<header
	class={cn(
		'w-full overflow-hidden',
		isPrimary ? 'bg-primary' : 'bg-background',
		rounded && 'rounded-bl-[20px] rounded-br-[20px]',
		className
	)}
>
	<div class="flex items-center justify-between px-8 pt-6">
		<span class="flex items-center gap-2">
			<span
				class={cn(
					'font-mono text-sm font-medium uppercase',
					isPrimary ? 'text-primary-foreground' : 'text-primary'
				)}
			>
				{countyName}
			</span>
		</span>
		{#if showUser}
			<span class="flex items-center gap-2">
				<span
					class={cn(
						'h-3 w-3 rounded-full border border-primary-foreground',
						isPrimary ? 'bg-teal-400' : 'bg-primary'
					)}
				></span>
				<span
					class={cn(
						'font-mono text-sm font-medium',
						isPrimary ? 'text-primary-foreground' : 'text-primary'
					)}
				>
					YOU
				</span>
			</span>
		{/if}
	</div>

	{#if question}
		<div class="px-8 pt-4 pb-4">
			<p
				class={cn(
					'font-mono text-sm font-medium uppercase',
					isPrimary ? 'text-primary-foreground' : 'text-primary'
				)}
			>
				{question}
			</p>
		</div>
	{/if}

	{#if title}
		<h1
			class={cn(
				'px-8 pb-6 font-sans text-4xl font-bold leading-10',
				isPrimary ? 'text-primary-foreground' : 'text-primary'
			)}
		>
			{title}
		</h1>
	{/if}

	{#if shareInput}
		<div class="px-7 pb-4">
			<button
				onclick={onShareClick}
				class="flex w-full items-center justify-center gap-2.5 rounded-full bg-white/10 px-5 py-2 shadow-[inset_2px_4px_4px_0px_rgba(0,0,0,0.20)] outline outline-2 outline-white/20"
			>
				<span class="font-sans text-sm font-medium text-primary-foreground/80">
					What's missing from the conversation?
				</span>
			</button>
		</div>
	{/if}
</header>
