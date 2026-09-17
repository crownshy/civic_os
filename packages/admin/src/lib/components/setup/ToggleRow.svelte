<script lang="ts">
	import { Pencil, Trash2 } from '@lucide/svelte';

	interface Props {
		/** Left column: the thing being switched on or off. */
		name: string;
		/** Middle column: whatever the card lists, options or a description. */
		detail: string;
		/** Dimmer second line under `detail`, for where the thing shows up. */
		note?: string;
		on: boolean;
		/** Read-only cards, and rows with a write in flight, pass true. */
		disabled?: boolean;
		onToggle: () => void;
		/** Renders an edit button left of the delete button. */
		onEdit?: () => void;
		/** Renders a delete button left of the switch. */
		onRemove?: () => void;
	}

	let { name, detail, note, on, disabled = false, onToggle, onEdit, onRemove }: Props = $props();
</script>

<div
	class="col-span-full grid grid-cols-subgrid items-center gap-4 px-2 py-5 {on ? '' : 'opacity-50'}"
>
	<div class="text-body font-bold">{name}</div>
	<div>
		<div class="text-body font-medium">{detail}</div>
		{#if note}
			<div class="mt-1 text-body text-muted-foreground">{note}</div>
		{/if}
	</div>
	<div class="flex items-center justify-end gap-3">
		{#if onEdit}
			<button
				type="button"
				onclick={onEdit}
				{disabled}
				aria-label={`Edit ${name}`}
				title="Edit this category"
				class="cursor-pointer touch-manipulation p-1 text-muted-foreground transition-all hover:text-primary active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
			>
				<Pencil class="size-4" />
			</button>
		{/if}
		{#if onRemove}
			<button
				type="button"
				onclick={onRemove}
				{disabled}
				aria-label={`Delete ${name}`}
				title="Delete this category"
				class="cursor-pointer touch-manipulation p-1 text-muted-foreground transition-all hover:text-destructive active:scale-90 active:text-destructive/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
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
			class="relative h-5 w-9 shrink-0 cursor-pointer touch-manipulation rounded-full transition-all select-none active:scale-95 active:duration-0 disabled:cursor-not-allowed disabled:active:scale-100 {on
				? 'bg-primary hover:bg-primary/90 active:bg-primary/80'
				: 'bg-muted-foreground/30 hover:bg-muted-foreground/45 active:bg-muted-foreground/55'}"
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
