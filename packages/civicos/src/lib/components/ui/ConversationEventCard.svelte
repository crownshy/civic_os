<script lang="ts">
	import { cn } from '$lib/utils';
	import ArrowRight from '$lib/assets/icons/arrow-right.svelte';
	import type { LocalizedEventDto } from '@crownshy/api-client/api';

	interface Props {
		event: LocalizedEventDto;
		class?: string;
		dateFormatter: Intl.DateTimeFormat;
		timeFormatter: Intl.DateTimeFormat;
	}

	let { event, class: className, dateFormatter, timeFormatter }: Props = $props();

	const eventDate = $derived(new Date(event.startTime));
</script>

<div
	class={cn(
		'group relative flex items-center overflow-hidden rounded-[20px] bg-card px-6 py-5 shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0px_8px_24px_0px_rgba(12,34,95,0.2)]',
		className
	)}
>
	<div class="min-w-0 flex-1">
		<h2 class="pr-7 font-display text-2xl leading-7 font-medium tracking-display text-foreground">
			{event.title}
		</h2>
		<p class="mt-1 font-sans text-base leading-4 font-bold text-foreground/70">
			<span class="text-primary">{dateFormatter.format(eventDate)}</span> &bull; {timeFormatter.format(
				eventDate
			)}
		</p>
	</div>

	<div class="absolute inset-y-0 right-0 flex items-center pr-5">
		<ArrowRight />
	</div>
</div>
