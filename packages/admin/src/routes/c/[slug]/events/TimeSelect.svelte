<script lang="ts">
	import * as Popover from '@civicos/shared/ui/popover';
	import { cn } from '@civicos/shared/utils';
	import { Clock } from '@lucide/svelte';
	import { QUARTER_HOURS, formatWallTime } from '$lib/utils/event-time';

	type Props = {
		id: string;
		/** Names the list of times, e.g. "Start time". */
		label: string;
		/** `HH:MM`, or empty when no time is picked yet. */
		value: string;
		/** Times before this `HH:MM` are greyed out. */
		min?: string;
		placeholder?: string;
		class?: string;
		onpick?: () => void;
	};

	let {
		id,
		label,
		value = $bindable(),
		min,
		placeholder = 'Pick a time',
		class: className,
		onpick
	}: Props = $props();

	// With nothing picked, open the list on a usual start time instead of midnight.
	const SCROLL_TO_WHEN_EMPTY = '09:00';

	let open = $state(false);
	let listEl = $state<HTMLElement | null>(null);

	function pick(time: string) {
		value = time;
		open = false;
		onpick?.();
	}

	function focusCurrent(event: Event) {
		event.preventDefault();
		const target = value || SCROLL_TO_WHEN_EMPTY;
		const item = listEl?.querySelector<HTMLButtonElement>(`[data-time="${target}"]`);
		item?.focus();
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		{id}
		class={cn(
			'flex h-14 w-full cursor-pointer touch-manipulation items-center gap-3 rounded-lg border border-input bg-background px-4 text-left text-body-lg font-semibold transition-colors outline-none hover:border-ring focus-visible:border-ring data-[state=open]:border-ring',
			className
		)}
	>
		<Clock class="size-5 shrink-0" />
		<span class={value ? '' : 'text-muted-foreground'}>
			{value ? formatWallTime(value) : placeholder}
		</span>
	</Popover.Trigger>
	<Popover.Content
		align="start"
		onOpenAutoFocus={focusCurrent}
		class="max-h-72 w-(--bits-popover-anchor-width) overflow-y-auto p-1"
	>
		<div bind:this={listEl} role="listbox" aria-label={label} class="flex flex-col">
			{#each QUARTER_HOURS as time (time)}
				{@const selected = time === value}
				<button
					type="button"
					role="option"
					aria-selected={selected}
					data-time={time}
					disabled={!!min && time < min}
					onclick={() => pick(time)}
					class="cursor-pointer rounded-md px-3 py-2 text-left text-body transition-colors outline-none hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent {selected
						? 'bg-primary/10 font-semibold text-primary'
						: ''}"
				>
					{formatWallTime(time)}
				</button>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
