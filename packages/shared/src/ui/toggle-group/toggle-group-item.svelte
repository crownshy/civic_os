<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from '../../utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ToggleGroupPrimitive.ItemProps = $props();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	class={cn(
		"group focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-foreground/5 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-colors [&_svg]:text-muted-foreground group-hover:[&_svg]:text-foreground data-[state=on]:[&_svg]:text-primary",
		className
	)}
	{...restProps}
/>
