<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ComposeOverlay, Button } from '$lib/components/ui';

	interface Props {
		question: string;
		countyName: string;
		onSubmit: (text: string, anonymous: boolean) => void;
		onBack: () => void;
	}

	let { question, countyName, onSubmit, onBack }: Props = $props();

	let showInstructions = $state(false);
</script>

<div class="relative" in:fly={{ y: 100, duration: 400, easing: cubicOut }}>
	<ComposeOverlay
		{question}
		{countyName}
		{onSubmit}
		{onBack}
		onShowInstructions={() => (showInstructions = true)}
	/>

	{#if showInstructions}
		<!-- Instructions overlay on top of compose -->
		<div class="absolute inset-0 z-50 bg-blue-950/90 backdrop-blur-[2.65px] flex flex-col items-center justify-center px-4" in:fade={{ duration: 200 }}>
			<div class="w-full rounded-[20px] bg-white p-6 outline-2 outline-white overflow-hidden">
				<h2 class="font-sans text-4xl font-bold leading-10 text-blue-800">
					How to contribute to this conversation:
				</h2>
				<div class="mt-6 h-1.5 w-14 bg-secondary rounded-full"></div>
				<div class="mt-6 font-sans text-lg font-medium leading-7 text-blue-900">
					<p>You can share ideas, opinions, values, or whatever else. Others will see these and vote on them.</p>
					<br />
					<p>You are contributing standalone statements – not responding to specific statements you see in the conversation.</p>
					<br />
					<p>No profanity, threats, etc.</p>
					<br />
					<p>You can submit as many statements as you'd like, but remember to listen!</p>
				</div>
			</div>
			<div class="mt-6 w-full px-2">
				<Button variant="primary" fullWidth onclick={() => (showInstructions = false)}>
					I UNDERSTAND
				</Button>
			</div>
		</div>
	{/if}
</div>
