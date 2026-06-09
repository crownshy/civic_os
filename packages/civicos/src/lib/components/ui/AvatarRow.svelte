<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		avatars: { id: string; color: string; emoji: string }[];
		selected?: string;
		onSelect?: (id: string) => void;
		class?: string;
	}

	let { avatars, selected, onSelect, class: className }: Props = $props();
</script>

<div class={cn('flex items-center justify-center gap-3 overflow-visible px-4', className)}>
	{#each avatars as avatar}
		<button
			aria-label="Select avatar"
			onclick={() => onSelect?.(avatar.id)}
			class={cn(
				'h-14 w-14 shrink-0 rounded-full border-4 transition-all',
				selected === avatar.id
					? 'scale-110 border-white shadow-lg shadow-white/30'
					: 'border-transparent'
			)}
			style="background-color: {avatar.color};"
		>
		</button>
	{/each}
</div>

<style>
	div {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	div::-webkit-scrollbar {
		display: none;
	}
</style>
