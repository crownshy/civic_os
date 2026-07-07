<script lang="ts">
	import { ChevronDown, Check } from '@lucide/svelte';
	import * as Popover from '@civicos/shared/ui/popover';

	interface Props {
		/** Column header label, e.g. "Author". */
		label: string;
		/** Popover option label, phrased as the positive action, e.g. "Include all statements". */
		optionLabel: string;
		/** Controlled — checked = the option is INCLUDED (shown). */
		checked?: boolean;
		align?: 'left' | 'center' | 'right';
		onchange?: (next: boolean) => void;
	}

	let { label, optionLabel, checked = false, align = 'left', onchange }: Props = $props();

	const justify = {
		left: 'justify-start',
		center: 'justify-center',
		right: 'justify-end'
	} as const;

	function toggle() {
		onchange?.(!checked);
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class={`text-foreground hover:text-foreground/70 font-ui text-caption flex w-full cursor-pointer items-center gap-1 font-semibold whitespace-nowrap uppercase transition-colors ${justify[align]}`}
	>
		{label}
		<ChevronDown class="size-3 shrink-0" />
	</Popover.Trigger>
	<Popover.Content
		align="start"
		class="w-48 overflow-hidden rounded-[10px] border-black/20 p-0 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)]"
	>
		<button
			type="button"
			onclick={toggle}
			class="hover:bg-muted/50 flex h-10 w-full cursor-pointer items-center justify-between border-b border-black/10 px-[9px] text-left transition-colors"
		>
			<span class="font-sans text-sm font-medium text-neutral-900">{optionLabel}</span>
			{#if checked}<Check class="text-destructive size-4 shrink-0" />{/if}
		</button>
	</Popover.Content>
</Popover.Root>
