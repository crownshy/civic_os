<script lang="ts">
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		/** Left column: the thing being switched on or off. */
		name: string;
		/** Middle column: whatever the card lists, options or a description. */
		detail: string;
		on: boolean;
		/** Read-only cards, and rows with a write in flight, pass true. */
		disabled?: boolean;
		onToggle: () => void;
		/** Renders a delete button left of the switch. */
		onRemove?: () => void;
	}

	let { name, detail, on, disabled = false, onToggle, onRemove }: Props = $props();
</script>

<div
	class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 px-2 py-5 {on
		? ''
		: 'opacity-50'}"
>
	<div class="text-body font-bold">{name}</div>
	<div class="text-body font-medium">{detail}</div>
	<div class="flex items-center justify-end gap-3">
		{#if onRemove}
			<button
				type="button"
				onclick={onRemove}
				{disabled}
				aria-label={`Delete ${name}`}
				title="Delete this category"
				class="cursor-pointer p-1 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Trash2 class="size-4" />
			</button>
		{/if}
		<button
			type="button"
			role="switch"
			aria-checked={on}
			aria-label={`Toggle ${name}`}
			{disabled}
			onclick={onToggle}
			class="relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed {on
				? 'bg-primary'
				: 'bg-muted-foreground/30'}"
		>
			<span
				class="absolute top-1 size-3 rounded-full bg-white transition-all {on
					? 'left-5'
					: 'left-1'}"
			></span>
		</button>
		<span class="w-7 text-body font-bold">{on ? 'On' : 'Off'}</span>
	</div>
</div>
