<script lang="ts">
	import type { PollStatus } from '@civicos/shared/data/poll-status';
	import { resolve } from '$app/paths';

	interface Props {
		status: PollStatus;
		/** Awaited by the button; resolve once the new state is loaded. */
		onGoLive: () => Promise<void>;
		/** Links to the Open Poll Status card, where Pause, Done and Reopen live. */
		slug: string;
	}

	let { status, onGoLive, slug }: Props = $props();

	const badge: Record<PollStatus, { label: string; class: string }> = {
		draft: { label: 'DRAFT', class: 'bg-muted-foreground/15 text-muted-foreground' },
		live: { label: 'LIVE', class: 'bg-success text-white' },
		paused: { label: 'PAUSED', class: 'bg-primary/10 text-primary' },
		complete: { label: 'DONE', class: 'bg-muted text-muted-foreground' }
	};

	let busy = $state(false);
	let error = $state<string | null>(null);

	async function goLive() {
		if (busy) return;
		busy = true;
		error = null;
		try {
			await onGoLive();
		} catch (e) {
			console.error('Failed to go live', e);
			error = 'Could not go live.';
		} finally {
			busy = false;
		}
	}

	const actionClass =
		'shrink-0 cursor-pointer px-2 py-0.5 text-caption font-medium text-primary underline transition-opacity hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:opacity-60';
</script>

<!-- shrink-0: the badge and its action are the fixed part of the header meta
     row, so a long share URL next to it is what gets truncated, not this. -->
<div class="flex shrink-0 items-center gap-1">
	{#if error}
		<span class="truncate text-caption text-destructive" role="alert">{error}</span>
	{/if}

	<span class={['shrink-0 px-2 py-0.5 text-caption font-medium', badge[status].class]}>
		{badge[status].label}
	</span>

	<!-- Going live is offered here so it does not require hunting for the Open
	     Poll tab. Pause, Done and Reopen need the card's explanation of what
	     participants will see, so the header links there instead. -->
	{#if status === 'draft'}
		<button type="button" onclick={goLive} disabled={busy} class={actionClass}>
			{busy ? 'Saving…' : 'Go live'}
		</button>
	{:else}
		<a href={resolve('/c/[slug]/open-poll/setup', { slug })} class={actionClass}>Change</a>
	{/if}
</div>
