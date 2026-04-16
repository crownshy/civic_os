<script lang="ts">
	import type { ConversationEvent } from '$lib/types/mock-data';
	import { cn } from '$lib/utils';

	interface Props {
		event: ConversationEvent;
		class?: string;
	}

	let { event, class: className }: Props = $props();
</script>

<div
	class={cn(
		'group relative flex py-5 items-center rounded-[20px] bg-card px-6 shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)] overflow-hidden transition-all duration-200 hover:shadow-[0px_8px_24px_0px_rgba(12,34,95,0.2)] hover:-translate-y-0.5',
		className
	)}
>
	<div class="min-w-0 flex-1 pr-4">
		<h2 class="font-sans text-2xl font-bold leading-7 text-foreground">
			{event.title}
		</h2>
		<p class="mt-1 font-sans text-base font-bold leading-4 text-foreground/70">
			{event.location} &bull; {event.time}
		</p>
	</div>

	<div class="shrink-0 flex h-8 items-center rounded-[30px] bg-primary px-2.5 overflow-hidden transition-colors duration-200 group-hover:bg-primary/85">
		<span class="font-mono text-base font-medium text-white">SIGN UP</span>
	</div>
</div>
