<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Input } from '@civicos/shared/ui/input';
	import { Button } from '@civicos/shared/ui/button';
	import { cn } from '@civicos/shared/utils';
	import { Eye, EyeOff } from '@lucide/svelte';

	type Props = Omit<HTMLInputAttributes, 'type' | 'value' | 'files'> & { value?: string };

	let { value = $bindable(''), class: className, ...rest }: Props = $props();

	let visible = $state(false);
</script>

<div class="relative">
	<Input
		{...rest}
		type={visible ? 'text' : 'password'}
		bind:value
		class={cn('h-10 rounded-md bg-background px-3 pr-11 text-body md:text-body', className)}
	/>
	<Button
		type="button"
		variant="ghost"
		size="icon-sm"
		class="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
		aria-label={visible ? 'Hide password' : 'Show password'}
		aria-pressed={visible}
		onclick={() => (visible = !visible)}
	>
		{#if visible}<EyeOff />{:else}<Eye />{/if}
	</Button>
</div>
