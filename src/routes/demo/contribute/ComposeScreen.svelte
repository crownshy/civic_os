<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ComposeOverlay, InfoOverlay } from '$lib/components/ui';

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
		<InfoOverlay
			title="How to contribute to this conversation:"
			buttonText="I UNDERSTAND"
			onClose={() => (showInstructions = false)}
			centered
		>
			<div class="mt-6 h-1.5 w-14 bg-primary rounded-full"></div>
			<div class="mt-6 font-sans text-lg font-medium leading-7 text-background">
				<ul class="list-disc pl-5">
					<li>You can share ideas, opinions, values, or whatever else. Others will see these and vote on them. </li>
					<li>You are contributing standalone statements – not responding to specific statements you see in the conversation.</li>
					<li>No profanity, threats, etc.</li>
					<li>You can submit as many statements as you’d like, but remember to listen!</li>
				</ul>
			</div>
		</InfoOverlay>
	{/if}
</div>
