<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Conversation } from '$lib/types/mock-data';

	interface Props {
		conversation: Conversation;
		class?: string;
	}

	let { conversation, class: className }: Props = $props();
</script>

<div
	class={cn(
		'flex h-16 flex-col justify-center rounded-[10px] bg-primary px-4',
		className
	)}
>
	<span class="font-mono text-lg font-medium text-primary-foreground">
		{conversation.title}
	</span>
	<span class="font-mono text-sm font-medium text-primary-foreground/70">
		{conversation.date} &bull; {conversation.organization}
	</span>
</div>
