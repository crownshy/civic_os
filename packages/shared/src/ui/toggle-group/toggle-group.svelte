<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from '../../utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: ToggleGroupPrimitive.RootProps = $props();
</script>

<!-- RootProps is a single|multiple union, so the destructured `value` widens to
     string | string[] and no longer fits either arm. The consumer's `type` picks
     the arm; the cast just stops that widening from surfacing here. -->
<ToggleGroupPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="toggle-group"
	class={cn(
		'bg-muted/40 border-foreground/15 inline-flex items-center gap-1 rounded-full border p-1 shadow-inner',
		className
	)}
	{...restProps}
/>
