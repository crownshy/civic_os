<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import { ZIPCODES, ZIP_LOOKUP, type ZipEntry } from '$lib/data/zipcodes';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import Input from './input/input.svelte';
	import { LucideX } from 'lucide-svelte';

	interface Props {
		value: string;
		placeholder?: string;
		disabled?: boolean;
		regionPrefixes?: string[];
		flash?: boolean;
	}

	let {
		value = $bindable(),
		placeholder = 'Enter your home zip code...',
		disabled = false,
		regionPrefixes = [],
		flash = $bindable(false)
	}: Props = $props();

	const match = $derived(ZIP_LOOKUP.get(value.trim()));
	const isValid = $derived(!!match);
	let searchValue = $state('');
	let open = $derived(!!searchValue.length);
	let flashing = $state(false);

	$effect(() => {
		const stripped = searchValue.replace(/\D/g, '').slice(0, 5);
		if (stripped !== searchValue) {
			searchValue = stripped;
		}
	});

	$effect(() => {
		if (flash) {
			flashing = true;
			const id = setTimeout(() => {
				flashing = false;
				flash = false;
			}, 800);
			return () => clearTimeout(id);
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

	const displayLabel = $derived(
		match ? `${value}, ${match.county} County` : value || ''
	);

	function selectZip(entry: ZipEntry) {
		value = entry.zip;
		open = false;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const selectedElement = document.querySelector('[data-slot="command-item"][aria-selected="true"]');
			const zipValue = selectedElement?.dataset?.value;
			const matchedZip = filtered.find((zipItem) => zipItem.zip === zipValue);
			if (!matchedZip) return;
			selectZip(matchedZip);
		}
	}

	function handleBlur() {
		if (searchValue.length === 5) {
			const entry = ZIP_LOOKUP.get(searchValue);
			if (entry) selectZip(entry);
		}
	}

	function handleRemoveZip() {
		value = '';
		searchValue = '';
	}
</script>

<style>
	@keyframes flash-border {
		0%, 100% { outline-color: color-mix(in srgb, var(--secondary) 30%, transparent); }
		25% { outline-color: var(--secondary); }
		50% { outline-color: color-mix(in srgb, var(--secondary) 30%, transparent); }
		75% { outline-color: var(--secondary); }
	}
	.flash-border-active {
		animation: flash-border 0.8s ease-in-out;
	}
</style>

<div class="flex w-full justify-center relative">
	<Popover.Root bind:open>
		<Popover.Trigger class="absolute inset-0 pointer-events-none opacity-0 h-0" />
			<span
				class={cn(
					'bg-card inline-flex w-fit items-center gap-2 justify-center rounded-full px-5 h-11 shadow-[inset_2px_4px_4.4px_0px_rgba(79,62,11,0.25)] outline-2 -outline-offset-2 font-sans text-base font-medium border-0 focus:ring-0',
					isValid
						? 'outline-primary text-primary'
						: 'outline-secondary/30 text-secondary',
					disabled && 'opacity-60 cursor-not-allowed',
					!value && 'text-secondary/80',
					flashing && 'flash-border-active'
				)}
			>
				<MapPinIcon class={cn('size-4 shrink-0', isValid ? 'text-primary' : 'text-secondary/60')} />
				{#if displayLabel}
					<span>{displayLabel}</span>
					<button
						type="button"
						class="h-4 w-4"
						onclick={handleRemoveZip}
						title="Remove selected zipcode"
					><LucideX class="h-4 w-4" /></button>
				{:else}
				<Input
					bind:value={searchValue}
					onkeypress={handleKeyDown}
					onblur={handleBlur}
					maxlength={5}
					class={cn(
						'border-none inline-flex w-fit items-center gap-2 justify-center px-5 h-11 font-sans text-base md:text-base font-medium placeholder:font-sans placeholder:text-base placeholder:text-secondary placeholder:font-medium focus-visible:ring-0',
						isValid
							? 'outline-primary text-primary'
							: 'outline-secondary/30 text-secondary',
						disabled && 'opacity-60 cursor-not-allowed',
						!value && 'text-secondary/80',
						flashing && 'flash-border-active'
					)}
					placeholder={displayLabel || placeholder}
					inputmode="numeric"
					pattern="[0-9]*"
				/>
				{/if}
			</span>
		<Popover.Content
			trapFocus={false}
			onOpenAutoFocus={(e) => e.preventDefault()}
		    onCloseAutoFocus={(e) => e.preventDefault()}
			side="top"
			class="w-65 overflow-hidden rounded-2xl bg-card p-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.20)] border-0"
		>
			<Command.Root shouldFilter={false}>
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
