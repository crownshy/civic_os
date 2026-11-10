<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		/** The glyph on the left, from `@lucide/svelte`. */
		icon: Snippet;
		/** A filled-in value from the account, drawn with a green edge. */
		filled?: boolean;
		/** Small help text under the input. */
		hint?: string;
		/** A link-like action on the right, such as "change". */
		action?: Snippet;
		class?: string;
		children: Snippet;
	};

	let { icon, filled = false, hint, action, class: className, children }: Props = $props();
</script>

<div
	class={cn(
		'flex w-full items-center gap-4 rounded-[20px] bg-white px-5 py-3 outline-1 -outline-offset-1',
		filled ? 'outline-primary/50' : 'outline-foreground/20',
		className
	)}
>
	<span class="flex size-5 shrink-0 items-center justify-center text-foreground">
		{@render icon()}
	</span>
	<div class="flex min-w-0 flex-1 flex-col">
		{@render children()}
		{#if hint}
			<span class="font-sans text-sm text-foreground/50">{hint}</span>
		{/if}
	</div>
	{#if action}
		{@render action()}
	{/if}
</div>
