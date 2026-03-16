<script lang="ts">
	import { tick } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { ZIPCODES, ZIP_LOOKUP, type ZipEntry } from '$lib/data/zipcodes';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		value: string;
		placeholder?: string;
		disabled?: boolean;
	}

	let { value = $bindable(), placeholder = 'Enter your home zip code...', disabled = false }: Props = $props();

	let open = $state(false);
	let searchValue = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	const filtered = $derived.by(() => {
		const q = searchValue.trim();
		if (!q) return ZIPCODES.slice(0, 6);
		return ZIPCODES.filter(
			(e) => e.zip.startsWith(q) || e.city.toLowerCase().startsWith(q.toLowerCase())
		).slice(0, 6);
	});

	const match = $derived(ZIP_LOOKUP.get(value.trim()));

	const displayLabel = $derived(
		match ? `${value}, ${match.county}` : value || ''
	);

	function selectZip(entry: ZipEntry) {
		value = entry.zip;
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<div class="flex w-full justify-center">
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef} disabled={disabled}>
			{#snippet child({ props })}
				<button
					{...props}
					class={cn(
						'bg-card w-65 h-13 inline-flex items-center justify-center rounded-full py-2 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline-2 -outline-offset-2 outline-white/10 text-center font-sans text-base font-medium text-secondary border-0 focus:ring-0',
						disabled && 'opacity-60 cursor-not-allowed',
						!value && 'text-secondary/80'
					)}
				>
					{displayLabel || placeholder}
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-65 overflow-hidden rounded-2xl bg-card p-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.20)] border-0">
			<Command.Root shouldFilter={false}>
				<Command.Input
					placeholder="Type a zip code or city..."
					bind:value={searchValue}
					class="font-sans text-base text-secondary placeholder:text-secondary/60"
					inputmode="numeric"
				/>
				<Command.List>
					<Command.Empty class="px-5 py-3 font-sans text-sm text-secondary/60 text-center">No matching zip codes.</Command.Empty>
					<Command.Group>
						{#each filtered as entry (entry.zip)}
							<Command.Item
								value={entry.zip}
								onSelect={() => selectZip(entry)}
								class="flex w-full items-center justify-between px-5 py-2.5 font-sans text-base font-medium text-secondary transition-colors hover:bg-primary/10 rounded-none"
							>
								<span>{entry.zip}</span>
								<div class="flex items-center gap-2">
									<span class="font-mono text-xs text-secondary/50">{entry.county}</span>
									<CheckIcon class={cn('size-4', value !== entry.zip && 'text-transparent')} />
								</div>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
