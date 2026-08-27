<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import PollStatRow from '$lib/components/PollStatRow.svelte';

	interface Props {
		/** Conversation-level live flag, the same source as the header badge. */
		isLive: boolean;
		/** Public poll URL, protocol stripped, e.g. "oregon.bloomproject.us/ai/poll". */
		/** Public poll URL. Empty when this Campaign has no public URL yet. */
		pollUrl: string;
		participants: number;
		statements: number;
		votes: number;
		/** Awaited by the toggle; resolve once the new state is loaded. */
		onToggle: (next: boolean) => Promise<void>;
	}

	let { isLive, pollUrl, participants, statements, votes, onToggle }: Props = $props();

	let busy = $state(false);
	let error = $state<string | null>(null);

	async function toggle() {
		if (busy) return;
		busy = true;
		error = null;
		try {
			await onToggle(!isLive);
		} catch (e) {
			console.error('Failed to change poll status', e);
			error = e instanceof Error ? e.message : 'Could not change the poll status.';
		} finally {
			busy = false;
		}
	}
</script>

<Card
	class="rounded-[20px] shadow-card transition-colors duration-200 hover:border-muted-foreground/40"
>
	<div class="flex flex-col gap-6 px-8 py-8">
		<div>
			<h2 class="font-display text-h4 font-semibold text-foreground md:text-h3">
				Your Open Poll is <span class={isLive ? 'text-success' : 'text-muted-foreground'}
					>{isLive ? 'LIVE.' : 'OFF.'}</span
				>
			</h2>
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
			<span class="text-body text-foreground">
				{isLive ? 'Done collecting responses?' : 'Ready to collect responses again?'}
			</span>
			<button
				type="button"
				onclick={toggle}
				disabled={busy}
				class="cursor-pointer text-body text-primary underline disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if busy}
					Saving…
				{:else if isLive}
					Turn off the poll.
				{:else}
					Turn the poll back on.
				{/if}
			</button>
		</div>
	</div>
</Card>
