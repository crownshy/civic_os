<script lang="ts">
	import { cn } from '../../utils.js';
	import { LinkPreview as HoverCardPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: HoverCardPrimitive.TriggerProps = $props();
</script>

<HoverCardPrimitive.Trigger
	bind:ref
	data-slot="hover-card-trigger"
	class={cn('', className)}
	{...restProps}
/>
