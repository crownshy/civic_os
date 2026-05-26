<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		size?: 'md' | 'lg' | 'xl';
		variant?: 'primary' | 'white';
		class?: string;
		children: import('svelte').Snippet;
	}

	let {
		size = 'lg',
		variant = 'primary',
		class: className,
		children
	}: Props = $props();
</script>

<p
	class={cn(
		'font-display tracking-display font-medium',
		size === 'md' && 'text-2xl leading-7',
		size === 'lg' && 'text-3xl leading-9',
		size === 'xl' && 'text-4xl',
		variant === 'primary' && 'text-primary',
		variant === 'white' && 'text-primary-foreground',
		className
	)}
>
	{@render children()}
</p>
