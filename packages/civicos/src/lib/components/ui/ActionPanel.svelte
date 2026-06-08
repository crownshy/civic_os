<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		onOpenChange?: (open: boolean) => void;
		cancelLabel?: string;
		umamiDismissEvent?: string;
		class?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		onOpenChange,
		cancelLabel = 'Nevermind, not now.',
		umamiDismissEvent,
		class: className,
		children,
		footer
	}: Props = $props();

	function close() {
		open = false;
		onOpenChange?.(false);
	}

	function handleBitsOpenChange(value: boolean) {
		if (!value) close();
	}
</script>

<DialogPrimitive.Root bind:open onOpenChange={handleBitsOpenChange}>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			class="fixed inset-0 z-50 bg-gradient-primary/80 backdrop-blur-sm duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
		/>
		<DialogPrimitive.Content
			class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[800px] flex-col duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-0 md:items-center md:justify-center md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95"
		>
			<div
				class={cn(
					'flex flex-col overflow-hidden rounded-t-[30px] border-t border-foreground/20 bg-background px-7 pt-6 pb-8 shadow-[0px_-4px_24px_rgba(0,0,0,0.15)] md:w-[440px] md:rounded-[30px] md:border md:pb-7 md:shadow-[0px_10px_30px_rgba(0,0,0,0.25)]',
					className
				)}
			>
				<DialogPrimitive.Title
					class="text-center font-display text-3xl leading-8 font-medium tracking-display text-foreground"
				>
					{title}
				</DialogPrimitive.Title>
				{#if description}
					<DialogPrimitive.Description
						class="mt-3 text-center font-sans text-base leading-6 font-medium text-secondary/80"
					>
						{description}
					</DialogPrimitive.Description>
				{/if}

				<div class="mt-5 flex flex-col">
					{@render children()}
				</div>

				{#if footer}
					<div class="mt-4">
						{@render footer()}
					</div>
				{/if}

				<button
					type="button"
					data-umami-event={umamiDismissEvent}
					onclick={close}
					class="mt-5 text-center font-sans text-base font-medium text-destructive hover:underline"
				>
					{cancelLabel}
				</button>
			</div>
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
