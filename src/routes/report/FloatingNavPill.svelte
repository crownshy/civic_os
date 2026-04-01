<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		text: string;
		visible: boolean;
		onclick: () => void;
		class?: string;
	}

	let { text, visible, onclick, class: className }: Props = $props();
</script>

{#if visible}
	<div
		class={cn(
			'fixed bottom-12 left-1/2 z-50 -translate-x-1/2 transition-all duration-300',
			visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
			className
		)}
	>
		<button
			{onclick}
			class="inline-flex items-center rounded-full bg-white px-7 py-2 font-sans text-base font-semibold text-green-950 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95"
		>
			{text}
		</button>
	</div>
{/if}
