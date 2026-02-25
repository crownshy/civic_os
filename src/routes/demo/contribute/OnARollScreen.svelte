<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AppHeader } from '$lib/components/layout';
	import { VoteBar } from '$lib/components/ui';

	interface Props {
		countyName: string;
		question: string;
		totalVotes: number;
		totalStatements: number;
		onVote: (type: 'agree' | 'disagree' | 'skip') => void;
		onEnd: () => void;
		onCompose: () => void;
	}

	let { countyName, question, totalVotes, totalStatements, onVote, onEnd, onCompose }: Props = $props();
</script>

<div class="flex h-dvh flex-col bg-background" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<AppHeader
		{countyName}
		{question}
		variant="on-primary"
		rounded
		shareInput
		onShareClick={onCompose}
		class="shrink-0"
	/>

	<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
		<div class="h-52 w-52 rounded-full bg-primary"></div>
		<p class="mt-8 text-center font-sans text-3xl font-bold leading-9 text-primary">
			YOU'RE ON A ROLL!
		</p>
	</div>

	<div class="shrink-0">
		<VoteBar
			onAgree={() => onVote('agree')}
			onDisagree={() => onVote('disagree')}
			onSkip={() => onVote('skip')}
			{onEnd}
			current={totalVotes}
			total={totalStatements}
		/>
	</div>
</div>
