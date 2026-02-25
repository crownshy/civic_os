<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from './Button.svelte';
	import { SkipForward } from 'lucide-svelte';


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

<div class={cn('overflow-hidden bg-linear-to-b from-card/20 via-card/90 via-20% to-card', className)}>
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
	<div class="flex items-center gap-3 bg-background px-4 py-7 border-t border-background">
		<Button variant="primary" class="flex-1" onclick={onAgree}>
			<span class="text-2xl mr-2">&#10003;</span>
			AGREE
		</Button>
		<Button variant="secondary" class="flex-1" onclick={onDisagree}>
			<span class="mr-2">X</span>
			DISAGREE
		</Button>

		<!-- Skip button -->
		<div class="relative inline-flex items-center justify-center">
			<Button aria-label="Skip" onclick={onSkip} variant="outline" 
				class="h-13 w-13 shrink-0 overflow-visible">
				<SkipForward class="h-6 w-6 text-white" />
			</Button>
			<svg
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			class="pointer-events-none absolute h-20 w-20"
			>
			<path 
				id="circlePath"
				d="M 50,90 a 40,40 0 1,1 0,-80 a 40,40 0 1,1 0,80"
				fill="none"
			/>
			<text fill="white" font-size="14">
				<textPath href="#circlePath" text-anchor="middle" startOffset="50%">
				SKIP
				</textPath>
			</text>
			</svg>
		</div>
	</div>
</div>
