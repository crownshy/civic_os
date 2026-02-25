<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import BlueHeader from './BlueHeader.svelte';

	interface Props {
		countyName: string;
		onSubmit: (email: string) => void;
		onSkip: () => void;
	}

	let { countyName, onSubmit, onSkip }: Props = $props();

	let email = $state('');
</script>

<div class="flex h-dvh flex-col bg-gradient-primary">
	<BlueHeader {countyName} />

	<div class="flex flex-1 flex-col items-center justify-center px-6">
		<div
			class="w-full rounded-[20px] bg-white p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.35)]"
			in:scale={{ start: 0.85, duration: 450, easing: elasticOut, delay: 100 }}
		>
			<h2 class="font-sans text-4xl font-bold leading-10 text-blue-800">Share your email</h2>
			<p class="mt-4 font-sans text-lg font-medium leading-7 text-blue-800/80">
				We'll only use this to give you updates on this conversation. No spam, no marketing emails or anything like that.
			</p>
			<form
				onsubmit={(e) => { e.preventDefault(); onSubmit(email); }}
				class="mt-5 flex h-12 items-center rounded-full bg-white shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)] outline-2 outline-primary overflow-hidden px-5"
			>
				<input
					bind:value={email}
					placeholder="email@xyz.com"
					class="w-full bg-transparent font-sans text-base font-medium text-blue-900 placeholder:text-blue-900/80 border-0 outline-none focus:ring-0"
				/>
			</form>
		</div>

		<div class="mt-6 w-full" in:fade={{ duration: 300, delay: 250 }}>
			<button
				onclick={() => onSubmit(email)}
				class="flex w-full items-center justify-center rounded-full bg-secondary px-7 py-3.5 font-mono text-lg font-medium text-secondary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				SHARE
			</button>
		</div>

		<button
			onclick={onSkip}
			class="mt-5 font-mono text-sm font-medium uppercase leading-5 text-white/70"
			in:fade={{ duration: 300, delay: 350 }}
		>
			I'll decide later.
		</button>
	</div>
</div>
