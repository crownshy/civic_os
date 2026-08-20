<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowUpRight, MessagesSquare } from '@lucide/svelte';
	import type { HostConversation } from './host-conversations';
	import type { ConversationStatus } from '$lib/conversations';

	interface Props {
		conversations: HostConversation[];
	}

	let { conversations }: Props = $props();

	const STATUS_STYLE: Record<ConversationStatus, string> = {
		live: 'bg-success/15 text-success',
		draft: 'bg-muted text-muted-foreground',
		complete: 'bg-muted text-muted-foreground'
	};
</script>

<section class="border-border rounded-xl border">
	<div class="border-border border-b px-5 py-4">
		<h2 class="text-body font-bold">Campaigns</h2>
		<p class="text-muted-foreground text-caption">
			Campaigns this Host owns, plus the ones it was added to as a co-host.
		</p>
	</div>

	{#if conversations.length === 0}
		<div class="text-muted-foreground flex flex-col items-center gap-2 px-5 py-10 text-body">
			<MessagesSquare class="size-5" />
			<p>This Host has no Campaigns yet.</p>
		</div>
	{:else}
		<ul>
			{#each conversations as conversation (conversation.id)}
				<li class="border-border flex items-center gap-3 border-b px-5 py-3 last:border-b-0">
					<div class="min-w-0 flex-1">
						<a
							href={`/c/${conversation.slug}/overview`}
							class="hover:text-primary inline-flex items-center gap-1 text-body font-semibold underline-offset-2 hover:underline"
						>
							{conversation.title}
							<ArrowUpRight class="size-3.5 shrink-0" />
						</a>
						<p class="text-muted-foreground truncate text-caption">/c/{conversation.slug}</p>
					</div>

					<span
						class={[
							'rounded px-1.5 py-0.5 text-caption font-semibold',
							STATUS_STYLE[conversation.status]
						].join(' ')}
					>
						{conversation.status}
					</span>

					<span class="text-muted-foreground text-caption">
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
</section>
