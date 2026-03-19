<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ComposeOverlay, Dialog, Link } from '$lib/components/ui';

	interface Props {
		question: string;
		countyName: string;
		firstVisit?: boolean;
		onSubmit: (text: string, anonymous: boolean) => void;
		onBack: () => void;
	}

	let { question, countyName, firstVisit = false, onSubmit, onBack }: Props = $props();

	let showInstructions = $state(false);

	$effect(() => {
		if (firstVisit) showInstructions = true;
	});
</script>

<div class="relative" in:fly={{ y: 100, duration: 400, easing: cubicOut }}>
	<ComposeOverlay
		{question}
		{countyName}
		{onSubmit}
		{onBack}
		onShowInstructions={() => (showInstructions = true)}
	/>

	<Dialog
		bind:open={showInstructions}
		title="How to contribute to this conversation:"
		buttonText="GOT IT, LET’S GO!"
	>
		<div class="px-7 pt-6 font-sans text-lg font-medium leading-7 text-foreground">
			<ul class="list-disc space-y-2 px-4">
				<li>Feel free to share any ideas, values, or positions on this question. Others will see these statements and vote on them.</li>
				<li>You are contributing standalone statements – not responding to specific statements you see in the conversation.</li>
				<li>Do not include profanity, threats, or other content that might cause distress to others. Any such threats will be removed from the platform.</li>
			</ul>
			<p class="mt-4">We want this to be a constructive and respectful space for everyone. By participating, you agree to our <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=4f85478f-bc07-46b7-a67b-e9f11de4b279" external>Terms of Use & Moderation Policy</Link>.</p>
		</div>
	</Dialog>
</div>
