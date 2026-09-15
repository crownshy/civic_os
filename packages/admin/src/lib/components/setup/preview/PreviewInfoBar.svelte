<script lang="ts">
	import { MapPin } from '@lucide/svelte';

	interface Props {
		placeName: string;
		/** Renders the END pill next to ABOUT, as the voting screen does. */
		end?: boolean;
	}

	let { placeName, end = false }: Props = $props();
</script>

<!-- Mirrors civicos InfoBar: place name left, ABOUT (plus END while voting) right. -->
<div class="flex shrink-0 items-center justify-between py-3.5 pr-3.5 pl-5">
	<div class="flex items-center gap-1.5">
		<MapPin class="size-3.5 text-foreground/80" />
		<span class="font-mono text-[11px] font-medium text-foreground/70">
			{placeName.toUpperCase()}
		</span>
	</div>
	<div class="flex items-center gap-1.5">
		<span
			class="rounded-full bg-secondary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-secondary"
		>
			ABOUT →
		</span>
		{#if end}
			<span
				class="rounded-full bg-destructive px-2 py-0.5 font-mono text-[11px] font-medium text-destructive-foreground"
			>
				END
			</span>
		{/if}
	</div>
</div>
