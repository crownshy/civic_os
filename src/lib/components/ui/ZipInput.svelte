<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		value: string;
		options: string[];
		placeholder?: string;
		disabled?: boolean;
		onSelect: (zip: string) => void;
	}

	let { value = $bindable(), options, placeholder = 'Enter your home zip code...', disabled = false, onSelect }: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let showDropdown = $state(false);

	const suggestions = $derived.by(() => {
		const q = value.trim();
		if (!q) return [];
		return options.filter(z => z.startsWith(q)).slice(0, 6);
	});

	function select(zip: string) {
		value = zip;
		showDropdown = false;
		inputEl?.blur();
		onSelect(zip);
	}
</script>

<div class="relative flex w-full justify-center">
		<input
			bind:this={inputEl}
			bind:value
			{placeholder}
			{disabled}
			inputmode="numeric"
			maxlength={5}
			onfocus={() => { if (!disabled) showDropdown = true; }}
			onblur={() => setTimeout(() => (showDropdown = false), 150)}
			class="bg-card w-65 h-13 inline-flex items-center justify-center rounded-full py-2 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline-2 -outline-offset-2 outline-white/10 text-center font-sans text-base font-medium text-secondary placeholder:text-secondary/80 border-0 outline-none focus:ring-0 disabled:opacity-60 disabled:cursor-not-allowed"
		/>
	<!-- </div> -->
	{#if showDropdown && suggestions.length > 0}
		<div
			class="absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-card shadow-[0px_8px_24px_0px_rgba(0,0,0,0.20)]"
			transition:fade={{ duration: 120 }}
		>
			{#each suggestions as zip (zip)}
				<button
					type="button"
					onclick={() => select(zip)}
					class="flex w-full items-center justify-between px-5 py-2.5 font-sans text-base font-medium text-secondary transition-colors hover:bg-primary/10"
				>
					<span>{zip}</span>
					<span class="font-mono text-xs text-secondary/50">Utah County</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
