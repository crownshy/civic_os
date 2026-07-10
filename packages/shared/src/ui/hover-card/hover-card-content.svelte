<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from 'bits-ui';
	import HoverCardPortal from './hover-card-portal.svelte';
	import { cn, type WithoutChildrenOrChild } from '../../utils.js';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		align = 'center',
		portalProps,
		...restProps
	}: HoverCardPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof HoverCardPortal>>;
	} = $props();
</script>

<HoverCardPortal {...portalProps}>
	<HoverCardPrimitive.Content
		bind:ref
		data-slot="hover-card-content"
		{sideOffset}
		{align}
		class={cn(
			'bg-popover text-popover-foreground z-50 w-64 origin-(--bits-link-preview-content-transform-origin) rounded-lg border p-4 shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-end-2 data-[side=right]:slide-in-from-start-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
			className
		)}
		{...restProps}
	/>
</HoverCardPortal>
