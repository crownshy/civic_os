<script lang="ts">
	import { cn } from '$lib/utils';
	import { FastForward, Check, X } from 'lucide-svelte';
		import Button from './Button.svelte';


	interface Props {
		onAgree?: () => void;
		onDisagree?: () => void;
		onSkip?: () => void;
		onEnd?: () => void;
		remaining?: number;
		total?: number;
		disabled?: boolean;
		class?: string;
	}

	let {
		onAgree,
		onDisagree,
		onSkip,
		onEnd,
		remaining = 0,
		total = 10,
		disabled = false,
		class: className
	}: Props = $props();

	const progress = $derived(total > 0 ? ((total - remaining) / total) * 100 : 0);
</script>

<div class={cn('shrink-0 overflow-hidden bg-linear-to-b from-card/20 via-card/90 via-20% to-card', className)}>
	<!-- Remaining / End pills row -->
	<div class="flex items-center justify-between px-6 py-2 pb-3">
		<span class="inline-flex items-center rounded-[20px] bg-primary/20 px-3 py-1.5">
			<span class="font-mono text-base font-medium text-primary">{remaining} LEFT</span>
		</span>
		<button onclick={onEnd} class="inline-flex items-center rounded-[20px] bg-destructive/20 px-3 py-1.5">
			<span class="font-mono text-base font-medium text-destructive">END</span>
		</button>
	</div>

	<!-- Progress bar -->
	<div class="relative h-1.5 w-full bg-primary/30">
		<div
			class="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Vote buttons row -->
	<div class="border-t border-background bg-background px-5 py-8">
	
		<div class="flex flex-nowrap items-end justify-center gap-2.5">
			<button
				{disabled}
				onclick={onAgree}
				class="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden rounded-[30px] bg-primary px-4 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Check class="h-5 w-5" />
				<span class="font-mono text-base font-sm text-foreground">AGREE</span>
			</button>
			<button
				{disabled}
				onclick={onDisagree}
				class="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden rounded-[30px] bg-black/30 px-4 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
			>
				<X class="h-5 w-5" />
				<span class="font-mono text-base font-sm text-foreground">DISAGREE</span>
			</button>
			
		<!-- Skip button -->
		<div class="relative inline-flex items-center justify-center">
			<Button {disabled} aria-label="Skip" onclick={onSkip} variant="outline" 
				class="h-13 w-13 shrink-0 overflow-visible">
				<FastForward class="h-6 w-6 text-foreground" />
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
			<text fill="background" opacity={`${disabled ? 0.5 : 1}`} font-size="14">
				<textPath href="#circlePath" text-anchor="middle" startOffset="50%">
				PASS
				</textPath>
			</text>
			</svg>
		</div>
		</div>
	</div>
</div>
