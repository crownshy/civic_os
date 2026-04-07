<script lang="ts">
	import { cn } from '$lib/utils';
	import { SkipForward, Check, X } from 'lucide-svelte';
	import Button from './Button.svelte';


	interface Props {
		onAgree?: () => void;
		onDisagree?: () => void;
		onSkip?: () => void;
		onEnd?: () => void;
		remaining?: number;
		total?: number;
		disabled?: boolean;
		skeleton?: boolean;
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
		skeleton = false,
		class: className
	}: Props = $props();

	const progress = $derived(total > 0 ? ((total - remaining) / total) * 100 : 0);
</script>

<div class={cn('shrink-0 overflow-hidden', skeleton && 'pointer-events-none opacity-40', className)}>
	<!-- Remaining / End pills row -->
	<div class="flex items-center justify-between px-6 py-2 pb-3">
		<span class="inline-flex items-center rounded-[20px] bg-secondary px-3 py-1.5">
			<span class="font-mono text-base font-medium text-secondary-foreground">{remaining} LEFT</span>
		</span>

		
		<Button onclick={onEnd} size="sm" variant="pill" class="bg-accent text-secondary" >
			<span class="font-mono text-base font-medium">END</span>
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
	<div class="border-t border-background bg-[#FFEDD3] px-5 py-8">
	
		<div class="flex flex-nowrap items-end justify-center gap-2.5">
			<Button
				{disabled}
				onclick={onAgree}
				class="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden rounded-[30px] bg-primary px-4 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Check class="h-5 w-5" />
				<span>AGREE</span>
			</Button>
			<Button
				{disabled}
				variant="destructive"
				onclick={onDisagree}
				class="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden rounded-[30px] px-4 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
			>
				<X class="h-5 w-5" />
				<span>DISAGREE</span>
		</Button>
			
		<!-- Skip button -->
		<div class="relative inline-flex items-center justify-center">
			<Button {disabled} aria-label="Skip" onclick={onSkip} variant="outline" 
				class="h-13 w-13 shrink-0 overflow-visible">
				<SkipForward fill="currentColor" class="h-6 w-6 text-secondary" />
			</Button>
			<svg
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			class="pointer-events-none absolute h-20 w-20 font-mono"
			>
				<path 
					id="circlePath"
					d="M 50,90 a 40,40 0 1,1 0,-80 a 40,40 0 1,1 0,80"
					fill="none"
				/>
				<text fill="#A6722E" opacity={`${disabled ? 0.5 : 1}`} font-size="14">
					<textPath href="#circlePath" text-anchor="middle" startOffset="50%">
					UNSURE
					</textPath>
				</text>
			</svg>
		</div>
		</div>
	</div>
</div>
