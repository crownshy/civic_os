<script lang="ts">
	import { Button } from '$lib/components/ui';
	import type { PollStatus } from '@civicos/shared/data/poll-status';

	interface Props {
		status: Extract<PollStatus, 'paused' | 'complete'>;
		reportHref: string;
	}

	let { status, reportHref }: Props = $props();
</script>

<!-- Stands where the join form was, so a closed poll still answers the one
     question this spot exists for: can I take part right now? -->
<div class="flex w-full flex-col items-center gap-2 text-center" role="status">
	{#if status === 'paused'}
		<p class="font-display text-xl font-medium md:text-2xl">Not collecting responses right now.</p>
		<p class="font-sans text-base font-medium opacity-80 md:text-lg">
			This poll is paused. Check back soon, or sign up below for updates.
		</p>
	{:else}
		<p class="font-display text-xl font-medium md:text-2xl">This poll is complete.</p>
		<p class="font-sans text-base font-medium opacity-80 md:text-lg">See what everyone said.</p>
		<Button variant="primary" fullWidth href={reportHref} class="mt-4">SEE THE RESULTS</Button>
	{/if}
</div>
