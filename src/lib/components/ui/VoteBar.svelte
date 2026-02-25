<script lang="ts">
	import { cn } from '$lib/utils';

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
		<span class="rounded-[20px] bg-secondary/20 px-3 py-1.5 font-mono text-base font-medium text-secondary">
			{remaining} LEFT
		</span>
		<button
			onclick={onEnd}
			class="rounded-[20px] bg-destructive/20 px-3 py-1.5 font-mono text-base font-medium text-destructive hover:opacity-80"
		>
			END
		</button>
	</div>

	<!-- Progress bar -->
	<div class="relative h-1.5 w-full bg-secondary/30">
		<div
			class="absolute left-0 top-0 h-full bg-secondary transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Vote buttons row -->
	<div class="flex items-center gap-3.5 bg-background px-7 py-5 border-t border-background">
		<button
			onclick={onAgree}
			class="flex h-14 flex-1 items-center justify-center rounded-full bg-secondary font-mono text-lg font-medium text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
		>
			&#10003; AGREE
		</button>
		<button
			onclick={onDisagree}
			class="flex h-14 flex-1 items-center justify-center rounded-full bg-black/30 font-mono text-lg font-medium text-white shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
		>
			X DISAGREE
		</button>
		<button
			aria-label="Skip"
			onclick={onSkip}
			class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 outline outline-4 outline-white"
		>
		</button>
	</div>
</div>
