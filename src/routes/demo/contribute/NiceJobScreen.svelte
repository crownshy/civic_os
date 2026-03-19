<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AboutBar, Button, EmojiCircle } from '$lib/components/ui';

	interface Props {
		countyName: string;
		remaining?: number;
		onKeepVoting: () => void;
		onDone: () => void;
	}

	let { countyName, remaining, onKeepVoting, onDone }: Props = $props();
</script>

<div class="flex h-full flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<AboutBar {countyName} />

	<!-- Centered content -->
	<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
		<EmojiCircle emoji="🎉" size="lg" />
		<p class="mt-8 text-center font-sans text-3xl font-bold leading-10 text-foreground">
			Nice job!
		</p>
		{#if remaining != null && remaining > 0}
			<p class="mt-4 text-center font-sans text-lg font-medium text-foreground/80">
				There are {remaining} more statements. Want to respond to a couple more?
			</p>
		{/if}
	</div>

	<!-- Bottom CTAs -->
	<div class="flex shrink-0 items-center gap-3.5 border-t border-background bg-secondary/20 px-7 py-8">
		<Button variant="primary" fullWidth onclick={onKeepVoting}>
			KEEP VOTING
		</Button>
		<Button variant="secondary" fullWidth onclick={onDone}>
			I'M DONE
		</Button>
	</div>
</div>
