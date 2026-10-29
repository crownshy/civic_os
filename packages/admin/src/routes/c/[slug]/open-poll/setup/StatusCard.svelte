<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import type { PollStatus } from '@civicos/shared/data/poll-status';
	import type { PollStatusTarget } from '$lib/api/poll-status';
	import { failureMessage, permissionDenied } from '$lib/api/describe-failure';
	import PollStatRow from '$lib/components/PollStatRow.svelte';
	import { pollStatusCopy } from '$lib/poll-status-copy';

	interface Props {
		/** Same source as the header badge. */
		status: PollStatus;
		/** Public poll URL, protocol stripped. Empty when this Campaign has no public URL yet. */
		pollUrl: string;
		participants: number;
		statements: number;
		votes: number;
		/** Awaited by the buttons; resolve once the new state is loaded. */
		onChange: (next: PollStatusTarget) => Promise<void>;
	}

	let { status, pollUrl, participants, statements, votes, onChange }: Props = $props();

	const current = $derived(pollStatusCopy[status]);

	let pending = $state<PollStatusTarget | null>(null);
	let error = $state<string | null>(null);

	async function change(next: PollStatusTarget) {
		if (pending) return;
		pending = next;
		error = null;
		try {
			await onChange(next);
		} catch (e) {
			console.error('Failed to change poll status', e);
			error =
				permissionDenied(e, 'change this poll’s status') ??
				failureMessage(e, 'Could not change the poll status.');
		} finally {
			pending = null;
		}
	}
</script>

<Card
	class="rounded-[20px] shadow-card transition-colors duration-200 hover:border-muted-foreground/40"
>
	<div class="flex flex-col gap-6 px-8 py-8">
		<div>
			<h2 class="font-display text-h4 font-semibold text-foreground md:text-h3">
				Your Open Poll is <span class={current.tone}>{current.label}</span>
			</h2>
			<p class="mt-2 text-body text-foreground">{current.summary}</p>
			{#if pollUrl}
				<p class="mt-2 text-body text-foreground/70">
					at
					<a
						href={`https://${pollUrl}`}
						target="_blank"
						rel="noopener noreferrer"
						class="underline hover:text-foreground">{pollUrl}</a
					>
					<span aria-hidden="true">→</span>
				</p>
			{/if}
		</div>

		<PollStatRow
			stats={[
				{ label: 'Participants', value: participants },
				{ label: 'Statements', value: statements },
				{ label: 'Votes', value: votes.toLocaleString() }
			]}
		/>

		<div class="flex flex-wrap items-center justify-end gap-2 font-ui">
			{#if error}
				<span class="mr-auto text-body text-destructive">{error}</span>
			{/if}
			{#each current.actions as action (action.next)}
				<button
					type="button"
					onclick={() => change(action.next)}
					disabled={pending !== null}
					class="cursor-pointer text-body text-primary underline transition-opacity hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{pending === action.next ? 'Saving…' : action.label}
				</button>
			{/each}
		</div>
	</div>
</Card>
