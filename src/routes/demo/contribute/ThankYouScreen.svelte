<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AboutBar, EmojiCircle, Link } from '$lib/components/ui';
	import { session } from '$lib/services/session.svelte';

	interface Props {
		countyName: string;
		onBackToVoting?: () => void;
	}

	let { countyName, onBackToVoting }: Props = $props();
</script>

<div class="flex h-full flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<div class="flex flex-1 flex-col overflow-y-auto">
		<AboutBar {countyName} onBack={onBackToVoting} />
		<!-- Hero: emoji + heading -->
		<div class="flex flex-col items-center px-8 pt-14">
			<EmojiCircle emoji="🎉" size="lg" />

			<h1 class="mt-6 text-center font-sans text-4xl font-bold leading-10 text-foreground">
				Thank you!
			</h1>

			<p class="mt-2 text-center font-sans text-base font-medium leading-6 text-foreground/80">
			   Share your email to receive updates on this conversation and the Civic AI Initiative.	
			</p>
		</div>

		<!-- Live Conversations section -->
		<div class="mt-8 px-7 pb-8">
			<div class="flex items-center gap-2">
				<span class="rounded-[5px] bg-destructive px-2 py-1 font-sans text-sm font-bold leading-5 text-card">What Happens Next</span>
			</div>

			<div class="mt-4 font-sans text-lg font-normal leading-7 text-foreground">
				<p>
				The results of this Open Poll will be presented at the Civic AI Conference at Rhodes House,
Oxford, on 25 March 2026. The common themes and shared values that emerge will form the
foundation of live small-group dialogues at the summit and future conversations.	
				</p>
				<p class="mt-4">
				The ultimate goal is to surface common ground that allows communities, institutions, and
decision-makers to act together on how AI is developed and used in our lives.	
				</p>
			
				<div class="mt-8 outline-[0.5px] outline-foreground/40"></div>

				<p class="mt-14">
		  If you are interested in getting involved or learning more about Civic AI, please visit <a href='https://civic.ai/conference/'>civic.ai/conference</a> or contact us at <a href='mailto:hi@civic.ai'>hi@civic.ai</a>.
				</p>
			</div>
		</div>
	</div>
</div>
