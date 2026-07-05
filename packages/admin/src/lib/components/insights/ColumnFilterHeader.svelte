<script lang="ts">
	import { ChevronDown, Check } from '@lucide/svelte';
	import * as Popover from '@civicos/shared/ui/popover';

	interface Props {
		/** Column header label, e.g. "Author". */
		label: string;
		/** Popover option label, phrased as the positive action, e.g. "Include host statements". */
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
		class={`text-muted-foreground/60 hover:text-foreground font-ui text-caption flex w-full cursor-pointer items-center gap-1 font-semibold uppercase transition-colors ${justify[align]}`}
	>
		{label}
		<ChevronDown class="size-3" />
	</Popover.Trigger>
	<Popover.Content align="start" class="w-56 p-1">
		<button
			type="button"
			onclick={toggle}
			class="hover:bg-muted text-foreground flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-left text-sm font-medium"
		>
			<span
				class={`flex size-4 shrink-0 items-center justify-center rounded border ${
					checked
						? 'bg-primary border-primary text-primary-foreground'
						: 'border-muted-foreground/40'
				}`}
			>
				{#if checked}<Check class="size-3" />{/if}
			</span>
			{optionLabel}
		</button>
	</Popover.Content>
</Popover.Root>
