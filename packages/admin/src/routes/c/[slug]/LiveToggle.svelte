<script lang="ts">
	interface Props {
		/** Conversation-level live flag (Conversation.isLive). */
		isLive: boolean;
		/** Awaited by the button; resolve once the new state is loaded. */
		onToggle: (next: boolean) => Promise<void>;
	}

	let { isLive, onToggle }: Props = $props();

	let busy = $state(false);
	let error = $state<string | null>(null);

	async function toggle() {
		if (busy) return;
		busy = true;
		error = null;
		try {
			await onToggle(!isLive);
		} catch (e) {
			console.error('Failed to change conversation status', e);
			error = 'Could not change the status.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex min-w-0 items-center gap-1">
	{#if error}
		<span class="truncate text-caption text-destructive" role="alert">{error}</span>
	{/if}

	<span
		class={[
			'shrink-0 px-2 py-0.5 text-caption font-medium',
			isLive ? 'bg-success text-white' : 'bg-muted-foreground/15 text-muted-foreground'
		].join(' ')}
	>
		{isLive ? 'LIVE' : 'DRAFT'}
	</span>

	<!-- Same write as the Open Poll Status card, surfaced here so going live does
	     not require hunting for that tab. -->
	<button
		type="button"
		onclick={toggle}
		disabled={busy}
		class="shrink-0 cursor-pointer px-2 py-0.5 text-caption font-medium text-primary underline disabled:cursor-not-allowed disabled:opacity-60"
	>
		{#if busy}
			Saving…
		{:else if isLive}
			Turn off
		{:else}
			Go live
		{/if}
	</button>
</div>
