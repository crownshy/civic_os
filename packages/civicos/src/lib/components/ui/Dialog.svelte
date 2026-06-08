<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		buttonText?: string;
		onButtonClick?: () => void;
		onOpenChange?: (open: boolean) => void;
		centered?: boolean;
		requireScrollToBottom?: boolean;
		class?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		buttonText = 'GO BACK',
		onButtonClick,
		onOpenChange,
		centered = false,
		requireScrollToBottom = false,
		class: className,
		children,
		footer
	}: Props = $props();

	let hasScrolledToBottom = $state(false);
	let scrollEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (open) {
			hasScrolledToBottom = false;
			requestAnimationFrame(() => {
				if (scrollEl && scrollEl.scrollHeight <= scrollEl.clientHeight) {
					hasScrolledToBottom = true;
				}
			});
		}
	});

	function handleScroll() {
		if (!requireScrollToBottom || !scrollEl) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollEl;
		if (scrollTop + clientHeight >= scrollHeight - 20) {
			hasScrolledToBottom = true;
		}
	}

	let buttonDisabled = $derived(requireScrollToBottom && !hasScrolledToBottom);

	function handleClose() {
		open = false;
		onOpenChange?.(false);
		onButtonClick?.();
	}

	function handleOpenAutoFocus(e: Event) {
		e.preventDefault();
		const content = e.target as HTMLElement;
		content?.focus({ preventScroll: true });
	}

	function handleBitsOpenChange(value: boolean) {
		if (!value) {
			open = false;
			onOpenChange?.(false);
		}
	}
</script>

<DialogPrimitive.Root bind:open onOpenChange={handleBitsOpenChange}>
	<DialogPrimitive.Portal>
		{#if centered}
			<DialogPrimitive.Overlay
				class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-primary px-4 backdrop-blur-sm duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
			/>
			<DialogPrimitive.Content
				class="fixed inset-0 z-50 mx-auto flex max-w-[800px] flex-col items-center justify-center px-4 duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
			>
				<div
					class={cn(
						'w-full max-w-2xl overflow-hidden rounded-[20px] bg-card pt-10 pb-8 outline-2 outline-card',
						className
					)}
				>
					<DialogPrimitive.Title
						class="px-6 font-display text-4xl leading-10 font-medium tracking-display text-card-foreground"
					>
						{title}
					</DialogPrimitive.Title>
					{#if description}
						<DialogPrimitive.Description
							class="mt-2 px-6 font-sans text-lg leading-7 font-medium text-card-foreground/70"
						>
							{description}
						</DialogPrimitive.Description>
					{/if}
					{@render children()}
				</div>
				<div class="mt-6 w-full max-w-2xl px-2">
					{#if footer}
						{@render footer()}
					{:else}
						<Button variant="primary" fullWidth disabled={buttonDisabled} onclick={handleClose}>
							{buttonText}
						</Button>
					{/if}
				</div>
			</DialogPrimitive.Content>
		{:else}
			<DialogPrimitive.Overlay
				class="fixed inset-0 z-50 bg-gradient-primary backdrop-blur-sm duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
			/>
			<DialogPrimitive.Content
				onOpenAutoFocus={handleOpenAutoFocus}
				class="fixed inset-0 z-50 mx-auto flex max-w-[800px] flex-col pb-5 duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4"
			>
				<button type="button" class="absolute top-12 right-12 bg-red-100 p-2 rounded-full" onclick={handleClose}><X class="text-red-400" /></button>
				<div
					class={cn(
						'mx-4 mt-4 flex flex-1 flex-col overflow-hidden rounded-[20px] bg-card outline-2 -outline-offset-2 outline-card',
						className
					)}
				>
					<div bind:this={scrollEl} onscroll={handleScroll} class="flex-1 overflow-y-auto pt-10">
						<DialogPrimitive.Title
							class="px-7 font-display text-4xl leading-10 font-medium tracking-display text-card-foreground"
						>
							{title}
						</DialogPrimitive.Title>
						{#if description}
							<DialogPrimitive.Description
								class="mt-2 px-7 font-sans text-lg leading-7 font-medium text-card-foreground/70"
							>
								{description}
							</DialogPrimitive.Description>
						{/if}
						{@render children()}
					</div>
					<div class="shrink-0 px-6 pt-4 pb-6">
						{#if footer}
							{@render footer()}
						{:else}
							<Button variant="primary" fullWidth disabled={buttonDisabled} onclick={handleClose}>
								{buttonText}
							</Button>
						{/if}
					</div>
				</div>
			</DialogPrimitive.Content>
		{/if}
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
