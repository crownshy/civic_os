<script lang="ts">
	import { fade } from 'svelte/transition';
	import Button from './Button.svelte';
	import { Input } from './input';

	interface Props {
		onSubmit: (email: string) => void;
		onSkip: () => void;
	}

	let { onSubmit, onSkip }: Props = $props();

	let email = $state('');
</script>

<div class="flex w-full flex-col items-center">
	<div class="w-full rounded-[20px] bg-white p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.35)]">
		<h2 class="font-sans text-4xl leading-10 font-bold text-secondary">Share your email</h2>
		<p class="mt-4 font-sans text-lg leading-7 font-medium text-secondary/80">
			We'll only use this to give you updates on this conversation. No spam, no marketing emails or
			anything like that.
		</p>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				onSubmit(email);
			}}
			class="mt-5 flex h-12 items-center overflow-hidden rounded-full bg-white px-5 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline-2 outline-primary"
		>
			<Input
				bind:value={email}
				type="email"
				placeholder="email@xyz.com"
				class="w-full rounded-none border-0 bg-transparent font-sans text-base font-medium text-secondary shadow-none placeholder:text-secondary/80 focus-visible:ring-0"
			/>
		</form>
	</div>

	<div class="mt-6 w-full" in:fade={{ duration: 300, delay: 250 }}>
		<Button variant="primary" fullWidth onclick={() => onSubmit(email)}>SHARE</Button>
	</div>

	<Button variant="ghost" onclick={onSkip} class="mt-5">I'll decide later.</Button>
</div>
