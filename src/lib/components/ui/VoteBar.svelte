<script lang="ts">
	import { cn } from '$lib/utils';
	import { Check, X } from 'lucide-svelte';
	import Button from './Button.svelte';

	interface Props {
		onAgree?: () => void;
		onDisagree?: () => void;
		onSkip?: () => void;
		disabled?: boolean;
		skeleton?: boolean;
		class?: string;
	}

	let {
		onAgree,
		onDisagree,
		onSkip,
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
	<div class="rounded-t-[20px] border-t border-[#86654933] bg-[#FFE9C8] p-4">
		<div class="flex items-center gap-3">
			<div class="h-10 w-10 shrink-0 rounded-full bg-[#866549]"></div>
			<div class="flex flex-1 items-center rounded-full bg-white px-4 py-2.5">
				<span class="font-sans text-base font-medium text-[#866549]/60">What do you think?</span>
			</div>
		</div>
	</div>
</div>
