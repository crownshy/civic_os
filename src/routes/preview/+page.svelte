<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import type { RegionConfig } from '$lib/config/regions';
	import VotingScreen from '../contribute/VotingScreen.svelte';
	import ComposeScreen from '../contribute/ComposeScreen.svelte';
	import NiceJobScreen from '../contribute/NiceJobScreen.svelte';

	const region: RegionConfig = page.data.region;

	const STATEMENTS = [
		'AI tools should be required to clearly disclose when content has been AI-generated.',
		'Local governments should have the authority to regulate how AI is used in their communities.',
		'Schools should teach AI literacy starting in elementary school.',
		'The economic benefits of AI should be shared broadly, including with workers whose jobs are displaced.',
		'AI should not be used in criminal justice decisions without meaningful human oversight.',
	];

	type Screen = 'voting' | 'compose' | 'nicejob' | 'done';
	let screen = $state<Screen>('voting');

	let index = $state(0);
	let remaining = $state(STATEMENTS.length);
	const total = STATEMENTS.length;

	function handleVote(_type: 'agree' | 'disagree' | 'pass') {
		remaining = Math.max(0, remaining - 1);
		if (index < STATEMENTS.length - 1) {
			const wasFirst = index === 0;
			index++;
			screen = wasFirst ? 'nicejob' : 'voting';
		} else {
			screen = 'done';
		}
	}

	function reset() {
		index = 0;
		remaining = STATEMENTS.length;
		screen = 'voting';
	}
</script>

<AppShell>
	{#if screen === 'done'}
		<div class="flex h-full flex-col items-center justify-center gap-6 bg-gradient-primary px-8 text-center">
			<p class="font-mono text-sm font-medium uppercase text-muted-foreground">PREVIEW</p>
			<p class="font-sans text-2xl font-bold text-muted-foreground">End of voting flow</p>
			<button
				onclick={reset}
				class="rounded-full bg-primary px-6 py-3 font-mono text-sm font-medium text-primary-foreground"
			>
				RESET
			</button>
		</div>
	{:else if screen === 'nicejob'}
		<NiceJobScreen
			countyName={region.stateName}
			{region}
			{remaining}
			onKeepVoting={() => { screen = 'voting'; }}
			onDone={() => { screen = 'compose'; }}
			onEnd={() => { screen = 'done'; }}
		/>
	{:else if screen === 'compose'}
		<ComposeScreen
			question={region.question}
			countyName={region.stateName}
			onSubmit={() => { screen = 'voting'; }}
			onBack={() => { screen = 'voting'; }}
			{region}
		/>
	{:else}
		<VotingScreen
			countyName={region.stateName}
			statementText={STATEMENTS[index]}
			{remaining}
			{total}
			onVote={handleVote}
			onEnd={() => { screen = 'done'; }}
			onCompose={() => { screen = 'compose'; }}
			{region}
		/>
	{/if}
</AppShell>
