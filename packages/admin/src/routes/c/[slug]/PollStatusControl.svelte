<script lang="ts">
	import * as Popover from '@civicos/shared/ui/popover';
	import { ChevronDown, ArrowRight } from '@lucide/svelte';
	import type { PollStatus } from '@civicos/shared/data/poll-status';
	import type { PollStatusTarget } from '$lib/api/poll-status';
	import { resolve } from '$app/paths';
	import { permissionDenied } from '$lib/api/describe-failure';
	import { pollStatusCopy } from '$lib/poll-status-copy';

	interface Props {
		status: PollStatus;
		/** Awaited by the menu's buttons; resolve once the new state is loaded. */
		onChange: (next: PollStatusTarget) => Promise<void>;
		/** For the link to the Open Poll Setup tab, where the stats live. */
		slug: string;
	}

	let { status, onChange, slug }: Props = $props();

	const badgeClass: Record<PollStatus, string> = {
		draft: 'bg-muted-foreground/15 text-muted-foreground',
		live: 'bg-success text-white',
		paused: 'bg-primary/10 text-primary',
		complete: 'bg-muted text-muted-foreground'
	};

	const current = $derived(pollStatusCopy[status]);

	let open = $state(false);
	let pending = $state<PollStatusTarget | null>(null);
	let error = $state<string | null>(null);

	async function change(next: PollStatusTarget) {
		if (pending) return;
		pending = next;
		error = null;
		try {
			await onChange(next);
			open = false;
		} catch (e) {
			console.error('Failed to change poll status', e);
			error =
				permissionDenied(e, 'change this poll’s status') ??
				(e instanceof Error ? e.message : 'Could not change the poll status.');
		} finally {
			pending = null;
		}
	}
</script>

<!-- The status belongs to the Open Poll, not the whole Campaign (Events carry on
     after a poll is done), so the badge names it. shrink-0: a long share URL
     next to it is what gets truncated, not this. -->
<Popover.Root bind:open onOpenChange={() => (error = null)}>
	<Popover.Trigger
		class="flex shrink-0 cursor-pointer items-center gap-1.5 text-caption font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
		aria-label={`Open Poll is ${current.badge.toLowerCase()}. Change status`}
	>
		<span class="text-muted-foreground">Open Poll</span>
		<span class={['flex items-center gap-1 px-2 py-0.5', badgeClass[status]]}>
			{current.badge}
			<ChevronDown class="size-3.5" aria-hidden="true" />
		</span>
	</Popover.Trigger>
	<Popover.Content
		align="start"
		sideOffset={8}
		class="w-80 rounded-2xl border border-muted-foreground/20 p-0 font-ui shadow-lg"
	>
		<div class="flex flex-col gap-1 px-5 pt-5 pb-4">
			<p class="text-body-lg font-semibold text-foreground">
				Open Poll is <span class={current.tone}>{current.label}</span>
			</p>
			<p class="text-body text-muted-foreground">{current.summary}</p>
		</div>

		<div class="flex flex-col border-t border-border">
			{#each current.actions as action (action.next)}
				<button
					type="button"
					onclick={() => change(action.next)}
					disabled={pending !== null}
					class="cursor-pointer px-5 py-3 text-left text-body font-medium text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
				>
					{pending === action.next ? 'Saving…' : action.label}
				</button>
			{/each}
			{#if error}
				<p class="px-5 pb-3 text-body text-destructive" role="alert">{error}</p>
			{/if}
		</div>

		<a
			href={resolve('/c/[slug]/open-poll/setup', { slug })}
			onclick={() => (open = false)}
			class="flex items-center gap-1.5 border-t border-border px-5 py-3 text-body text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			Responses and seed statements <ArrowRight class="size-4" aria-hidden="true" />
		</a>
	</Popover.Content>
</Popover.Root>
