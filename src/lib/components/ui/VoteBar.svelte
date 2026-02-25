<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';

	interface Props {
		onAgree?: () => void;
		onDisagree?: () => void;
		onSkip?: () => void;
		onEnd?: () => void;
		current?: number;
		total?: number;
		class?: string;
	}

	let {
		onAgree,
		onDisagree,
		onSkip,
		onEnd,
		current = 0,
		total = 10,
		class: className
	}: Props = $props();

	const remaining = $derived(total - current);
	const progress = $derived(total > 0 ? (current / total) * 100 : 0);
</script>

<div class={cn('overflow-hidden bg-card', className)}>
	<!-- Remaining / End pills row -->
	<div class="flex items-center justify-between px-6 py-2">
		<Button variant="pill" size="sm">
			{remaining} LEFT
		</Button>
		<Button variant="destructive" size="sm" onclick={onEnd}>
			END
		</Button>
	</div>

	<!-- Progress bar -->
	<div class="relative h-1.5 w-full bg-secondary/30">
		<div
			class="absolute left-0 top-0 h-full bg-secondary transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Vote buttons row -->
	<div class="flex items-center gap-4 bg-background px-5 py-5 border-t border-background">
		<Button variant="primary" class="flex-1" onclick={onAgree}>
			<span class="text-2xl mr-2">&#10003;</span>
			AGREE
		</Button>
		<Button variant="secondary" class="flex-1" onclick={onDisagree}>
			<span class="mr-2">X</span>
			DISAGREE
		</Button>
		<button
			aria-label="Skip"
			onclick={onSkip}
			class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 outline outline-4 outline-white"
		>
		</button>
	</div>
</div>
