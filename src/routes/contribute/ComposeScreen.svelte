<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ComposeOverlay, Dialog, Link } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		question: string;
		countyName: string;
		firstVisit?: boolean;
		onSubmit: (text: string, anonymous: boolean) => void;
		onBack: () => void;
		region: RegionConfig
	}

	let { question, countyName, firstVisit = false, onSubmit, onBack , region}: Props = $props();

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
		region={region}
	/>

	<Dialog
		bind:open={showInstructions}
		title="Add your own perspective:"
		buttonText="GOT IT, LET’S GO!"
	>
		<div class="px-7 pt-6 font-sans text-lg font-medium leading-7 text-foreground">
			<p>Have something to say that the poll hasn't captured yet? This is your chance.</p>
			<ul class="list-disc space-y-2 px-4">
				<li><span class='font-bold'>Share a belief, concern, or value</span> in your own words. Other participants will see it and respond.</li>
				<li><span class='font-bold'>Write one idea per submission.</span>Your statement will stand on its own — not as a reply to anything specific.</li>
				<li><span class='font-bold'>Keep it respectful.</span> Profanity, threats, or content that could harm others will be removed.</li>
				<li><span class='font-bold'>No links or URLs, please.</span> This keeps the conversation focused and prevents spam.</li>
				<li><span class='font-bold'>This is a shared space.</span> By contributing, you agree to our <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=4f85478f-bc07-46b7-a67b-e9f11de4b279" external>Terms of Use & Moderation Policy</Link>.</li>
			</ul>
			<p class="mt-4">And don't overthink it. There's no wrong answer here.</p>
		</div>
	</Dialog>
</div>
