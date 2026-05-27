<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { InfoBar, Button, EmojiCircle } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		countyName: string;
		region: RegionConfig;
		remaining?: number;
		onKeepVoting: () => void;
		onDone: () => void;
		onEnd?: () => void;
	}

	let { countyName, region, remaining, onKeepVoting, onDone, onEnd }: Props = $props();
</script>

<div
	class="flex h-full flex-col bg-gradient-primary"
	in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}
>
	<InfoBar {region} {countyName} {onEnd} />

	<!-- Centered content -->
	<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
		<EmojiCircle emoji="💬" size="lg" />
		<p class="mt-8 text-center font-sans text-3xl leading-10 font-bold text-foreground">
			You shape the conversation.
		</p>
		<p class="mt-4 text-center font-sans text-lg font-medium text-foreground/80">
			Add a new statement for others to respond to. You can always find this option at the bottom of
			the screen while you are voting.
		</p>
	</div>

	<!-- Bottom CTAs -->
	<div class="flex shrink-0 flex-col gap-3 border-t border-background px-7 py-8">
		{#if remaining != null}
			<p class="text-center font-sans text-base font-medium text-foreground/60">
				{remaining} statements left. Hit <span class="font-bold text-destructive">END</span> at any time.
			</p>
		{/if}
		<div class="flex items-center gap-3.5">
			<Button variant="secondary" fullWidth onclick={onDone}>ADD STATEMENT</Button>
			<Button variant="primary" fullWidth onclick={onKeepVoting}>KEEP GOING</Button>
		</div>
	</div>
</div>
