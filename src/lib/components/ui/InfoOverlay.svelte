<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';

	interface Props {
		title: string;
		buttonText?: string;
		onClose: () => void;
		fullscreen?: boolean;
		centered?: boolean;
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		title,
		buttonText = 'GO BACK',
		onClose,
		fullscreen = false,
		centered = false,
		class: className = '',
		children
	}: Props = $props();
</script>

{#if centered}
	<div
		class={cn(
			'absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-primary backdrop-blur-sm px-4',
			className
		)}
		transition:fade={{ duration: 200 }}
	>
		<div class="w-full overflow-hidden max-w-2xl rounded-[20px] bg-card pt-10 pb-8 px-6 outline-2 outline-card">
			<h2 class="font-sans text-4xl font-bold leading-10 text-card-foreground">{title}</h2>
			{@render children()}
		</div>
		<div class="mt-6 w-full px-2 max-w-2xl">
			<Button variant="primary" fullWidth onclick={onClose}>
				{buttonText}
			</Button>
		</div>
	</div>
{:else}
	<div
		class={cn(
			'pb-5 flex flex-col overflow-hidden',
			fullscreen
				? 'fixed inset-y-0 left-1/2 z-3000 w-full -translate-x-1/2'
				: 'absolute inset-0 z-50',
			className
		)}
		transition:fade={{ duration: 200 }}
	>
		<div class="mx-4 mt-4 flex flex-1 flex-col overflow-hidden rounded-[20px] bg-card outline-2 -outline-offset-2 outline-white">
			<div class="flex-1 overflow-y-auto px-7 pt-10">
				<h2 class="font-sans text-4xl font-bold leading-10 text-card-foreground">{title}</h2>
				{@render children()}
			</div>
			<div class="shrink-0 px-6 pb-6 pt-4">
				<Button
					onclick={onClose}
					class="inline-flex w-full items-center justify-center rounded-[30px] bg-primary px-7 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
				>
					{buttonText}
				</Button>
			</div>
		</div>
	</div>
{/if}
