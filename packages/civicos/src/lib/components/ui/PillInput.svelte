<script lang="ts">
	import { cn } from '$lib/utils';
	import { Input } from '@civicos/shared/ui/input';

	interface Props {
		placeholder?: string;
		value?: string;
		showAvatar?: boolean;
		variant?: 'on-primary' | 'on-white';
		class?: string;
		oninput?: (e: Event) => void;
	}

	let {
		placeholder = '',
		value = $bindable(''),
		showAvatar = false,
		variant = 'on-white',
		class: className,
		oninput
	}: Props = $props();

	const isPrimary = $derived(variant === 'on-primary');
</script>

<div class={cn('flex items-center gap-3', className)}>
	{#if showAvatar}
		<span
			class={cn(
				'h-14 w-14 shrink-0 rounded-full',
				isPrimary ? 'bg-primary-foreground' : 'bg-primary'
			)}
		></span>
	{/if}
	<div
		class={cn(
			'flex h-14 flex-1 items-center rounded-full border-[3px] px-5',
			isPrimary ? 'border-white bg-white/10' : 'border-primary bg-transparent'
		)}
	>
		{#if isPrimary}
			<span class="mr-3 h-[5px] w-3.5 shrink-0 bg-white"></span>
		{/if}
		<Input
			type="text"
			{placeholder}
			bind:value
			{oninput}
			class={cn(
				'w-full rounded-none border-0 bg-transparent font-mono text-lg font-medium shadow-none placeholder:opacity-100 focus-visible:ring-0',
				isPrimary ? 'text-white placeholder:text-white' : 'text-primary placeholder:text-primary'
			)}
		/>
	</div>
</div>
