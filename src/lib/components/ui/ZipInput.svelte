<script lang="ts">
	import { tick } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import { ZIPCODES, ZIP_LOOKUP, type ZipEntry } from '$lib/data/zipcodes';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		value: string;
		placeholder?: string;
		disabled?: boolean;
		regionPrefixes?: string[];
		shake?: boolean;
	}

	let {
		value = $bindable(),
		placeholder = 'Enter your home zip code...',
		disabled = false,
		regionPrefixes = [],
		shake = $bindable(false)
	}: Props = $props();

	let open = $state(false);
	let searchValue = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);
	let shaking = $state(false);

	$effect(() => {
		const stripped = searchValue.replace(/\D/g, '');
		if (stripped !== searchValue) {
			searchValue = stripped;
		}
	});

	$effect(() => {
		if (shake) {
			shaking = true;
			setTimeout(() => {
				shaking = false;
				shake = false;
			}, 800);
		}
	});

	const filtered = $derived.by(() => {
		const q = searchValue.trim();
		if (!q) {
			if (regionPrefixes.length > 0) {
				return ZIPCODES.filter((e) =>
					regionPrefixes.some((p) => e.zip.startsWith(p))
				).slice(0, 6);
			}
			return [];
		}
		return ZIPCODES.filter((e) => e.zip.startsWith(q)).slice(0, 6);
	});

	const match = $derived(ZIP_LOOKUP.get(value.trim()));
	const isValid = $derived(!!match);

	const displayLabel = $derived(
		match ? `${value}, ${match.county} County` : value || ''
	);

	function selectZip(entry: ZipEntry) {
		value = entry.zip;
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<style>
	@keyframes flash-border {
		0%, 100% { outline-color: color-mix(in srgb, #A6722E 30%, transparent); }
		25% { outline-color: #A6722E; }
		50% { outline-color: color-mix(in srgb, #A6722E 30%, transparent); }
		75% { outline-color: #A6722E; }
	}
	.shake-flash {
		animation: flash-border 0.8s ease-in-out;
	}
</style>

<div class="flex w-full justify-center">
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef} disabled={disabled}>
			{#snippet child({ props })}
				<button
					{...props}
					class={cn(
						'bg-card inline-flex w-fit items-center gap-2 justify-center rounded-full px-5 h-11 shadow-[inset_2px_4px_4.4px_0px_rgba(79,62,11,0.25)] outline-2 -outline-offset-2 font-sans text-base font-medium border-0 focus:ring-0',
						isValid
							? 'outline-primary text-primary'
							: 'outline-secondary/30 text-secondary',
						disabled && 'opacity-60 cursor-not-allowed',
						!value && 'text-secondary/80',
						shaking && 'shake-flash'
					)}
				>
					<MapPinIcon class={cn('size-4 shrink-0', isValid ? 'text-primary' : 'text-secondary/60')} />
					{displayLabel || placeholder}
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content side="top" class="w-65 overflow-hidden rounded-2xl bg-card p-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.20)] border-0">
			<Command.Root shouldFilter={false}>
				<Command.Input
					placeholder="Enter zip code..."
					bind:value={searchValue}
					class="font-sans text-base text-secondary placeholder:text-secondary/60"
					inputmode="numeric"
					pattern="[0-9]*"
				/>
				<Command.List>
					{#if searchValue.trim()}
						<Command.Empty class="px-5 py-3 font-sans text-sm text-secondary/60 text-center">No matching zip codes.</Command.Empty>
					{/if}
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
