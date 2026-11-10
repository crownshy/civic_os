<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		open: boolean;
		/** The small mono label in the corner, usually the Campaign's title. */
		label: string;
		title: string;
		/** Read by screen readers when no visible description is rendered. */
		description?: string;
		class?: string;
		children: Snippet;
		footer?: Snippet;
	};

	let {
		open = $bindable(false),
		label,
		title,
		description,
		class: className,
		children,
		footer
	}: Props = $props();
</script>

<DialogPrimitive.Root bind:open>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			class="fixed inset-0 z-50 bg-background/60 backdrop-blur-[2px] duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
		/>
		<DialogPrimitive.Content
			class={cn(
				'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[860px] flex-col overflow-hidden rounded-t-[30px] border-t border-accent-foreground/50 bg-muted duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom motion-reduce:duration-0',
				className
			)}
		>
			<div class="flex shrink-0 items-center justify-between px-7 pt-5">
				<span class="font-mono text-xs font-medium text-foreground uppercase">{label}</span>
				<DialogPrimitive.Close
					class="touch-manipulation rounded-full bg-destructive/20 p-1.5 transition-all hover:bg-destructive/30 active:scale-90"
					aria-label="Close"
				>
					<X class="size-4 text-destructive" />
				</DialogPrimitive.Close>
			</div>

			<div class="flex-1 overflow-y-auto px-4 pt-8 pb-4">
				<DialogPrimitive.Title
					class="mx-auto max-w-xs text-center font-display text-4xl leading-10 font-medium tracking-display text-foreground"
				>
					{title}
				</DialogPrimitive.Title>
				{#if description}
					<DialogPrimitive.Description class="sr-only">{description}</DialogPrimitive.Description>
				{/if}
				{@render children()}
			</div>

			{#if footer}
				<div class="shrink-0 px-6 pt-2 pb-8">
					{@render footer()}
				</div>
			{/if}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
