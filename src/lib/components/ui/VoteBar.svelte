<script lang="ts">
	import { cn } from '$lib/utils';
	import { Check, X, ArrowRight } from 'lucide-svelte';
	import smiley from '$lib/assets/smiley.svg';
	import Button from './Button.svelte';

	interface Props {
		onAgree?: () => void;
		onDisagree?: () => void;
		onSkip?: () => void;
		onCompose?: () => void;
		disabled?: boolean;
		skeleton?: boolean;
		class?: string;
	}

	let {
		onAgree,
		onDisagree,
		onSkip,
		onCompose,
		disabled = false,
		skeleton = false,
		class: className
	}: Props = $props();
</script>

<div class={cn('shrink-0', skeleton && 'pointer-events-none opacity-40', className)}>
	<!-- Vote buttons row (sits between statement and compose area) -->
	<div class="flex items-center gap-2 px-4 py-3">
		<Button
			{disabled}
			onclick={onAgree}
			class="min-w-0 flex-1 h-auto gap-1.5 rounded-[30px] px-4 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span>AGREE</span>
		</Button>
		<Button
			{disabled}
			variant="destructive"
			onclick={onDisagree}
			class="min-w-0 flex-1 h-auto gap-1.5 rounded-[30px] px-4 py-3.5 shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span>DISAGREE</span>
		</Button>
		<Button
			{disabled}
			onclick={onSkip}
			class="min-w-0 flex-1 h-auto rounded-[30px] bg-[#FFE9C8] px-4 py-3.5 text-secondary shadow-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span>UNSURE</span>
		</Button>
	</div>

	<!-- Compose area -->
	<button onclick={onCompose} class="w-full rounded-t-[30px] border-t border-[#86654933] bg-[#FFE9C8] p-4 text-left">
		<div class="flex items-center gap-3">
			<img src={smiley} alt="" class="h-10 w-10 shrink-0 rounded-full shadow-[0px_4px_10px_0px_rgba(83,42,14,0.25)]" />
			<div class="flex flex-1 items-center justify-between rounded-full bg-[linear-gradient(to_bottom,white_0%,white_80%,#E8EAED_100%)] px-4 py-2.5 shadow-[0px_4px_10px_0px_rgba(83,42,14,0.25)]">
				<span class="font-sans text-lg font-bold text-[#664025]">What do you think?</span>
				<ArrowRight class="h-6 w-6 shrink-0 text-[#664025]" />
			</div>
		</div>
	</button>
</div>
