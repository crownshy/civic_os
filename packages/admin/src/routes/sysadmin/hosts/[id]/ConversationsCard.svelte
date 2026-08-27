<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowUpRight, MessagesSquare } from '@lucide/svelte';
	import type { AssignableConversation, HostConversation } from './host-conversations';
	import type { ConversationStatus } from '$lib/conversations';
	import { resolve } from '$app/paths';

	interface Props {
		conversations: HostConversation[];
		/** Campaigns with no owning Host, offered in the assign control. */
		assignable?: AssignableConversation[];
	}

	let { conversations, assignable = [] }: Props = $props();

	let selected = $state('');

	const STATUS_STYLE: Record<ConversationStatus, string> = {
		live: 'bg-success/15 text-success',
		draft: 'bg-muted text-muted-foreground',
		complete: 'bg-muted text-muted-foreground'
	};
</script>

<section class="rounded-xl border border-border">
	<div class="border-b border-border px-5 py-4">
		<h2 class="text-body font-bold">Campaigns</h2>
		<p class="text-caption text-muted-foreground">
			Campaigns this Host owns, plus the ones it was added to as a co-host.
		</p>
	</div>

	{#if conversations.length === 0}
		<div class="flex flex-col items-center gap-2 px-5 py-10 text-body text-muted-foreground">
			<MessagesSquare class="size-5" />
			<p>This Host has no Campaigns yet.</p>
		</div>
	{:else}
		<ul>
			{#each conversations as conversation (conversation.id)}
				<li class="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
					<div class="min-w-0 flex-1">
						<a
							href={resolve('/c/[slug]/overview', { slug: conversation.slug })}
							class="inline-flex items-center gap-1 text-body font-semibold underline-offset-2 hover:text-primary hover:underline"
						>
							{conversation.title}
							<ArrowUpRight class="size-3.5 shrink-0" />
						</a>
						<p class="truncate text-caption text-muted-foreground">/c/{conversation.slug}</p>
					</div>

					<span
						class={[
							'rounded px-1.5 py-0.5 text-caption font-semibold',
							STATUS_STYLE[conversation.status]
						].join(' ')}
					>
						{conversation.status}
					</span>

					<span class="text-caption text-muted-foreground">
						{conversation.access === 'owner' ? 'Owner' : 'Co-host'}
					</span>

					{#if conversation.access === 'cohost'}
						<form method="POST" action="?/revokeAccess" use:enhance>
							<input type="hidden" name="conversationId" value={conversation.id} />
							<Button type="submit" variant="destructive-outline" size="sm">Remove access</Button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if assignable.length}
		<form
			method="POST"
			action="?/assignCampaign"
			use:enhance
			class="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4"
		>
			<select
				name="conversationId"
				bind:value={selected}
				class="min-w-0 flex-1 rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
			>
				<option value="">Assign an unowned Campaign…</option>
				{#each assignable as campaign (campaign.id)}
					<option value={campaign.id}>{campaign.title}</option>
				{/each}
			</select>
			<Button type="submit" disabled={!selected}>Assign</Button>
		</form>
	{/if}
</section>
