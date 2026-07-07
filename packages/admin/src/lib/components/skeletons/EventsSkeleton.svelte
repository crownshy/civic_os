<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors events/+page.svelte: the filter/view toolbar row and a stack of
	// event cards (date block, title/time, RSVP count, open pill).
</script>

<div class="flex-1 space-y-3.5 overflow-y-auto px-4 py-5 sm:px-5" aria-hidden="true">
	<!-- Toolbar: filter pills (left) + view toggles / new-event (right) -->
	<div class="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
		<div class="flex flex-wrap items-center gap-1.5">
			{#each Array(3) as _, i (i)}
				<Skeleton class="h-8 w-24 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl" />
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Skeleton class="h-8 w-14 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl" />
			<Skeleton class="h-8 w-20 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl" />
			<Skeleton class="h-8 w-28 rounded-full" />
		</div>
	</div>

	<!-- Event cards -->
	<div class="space-y-2.5">
		{#each Array(5) as _, i (i)}
			<Card>
				<div class="flex items-center gap-4 p-4">
					<div class="w-16 shrink-0 space-y-1.5 text-center">
						<Skeleton class="mx-auto h-3 w-10" />
						<Skeleton class="mx-auto h-4 w-12" />
					</div>
					<div class="border-border hidden h-9 self-center border-l sm:block"></div>
					<div class="min-w-0 flex-1 space-y-2">
						<Skeleton class="h-4 w-48" />
						<Skeleton class="h-3 w-28" />
					</div>
					<div class="hidden w-24 space-y-1.5 text-right sm:block">
						<Skeleton class="ml-auto h-3 w-12" />
						<Skeleton class="ml-auto h-4 w-10" />
					</div>
					<Skeleton class="hidden h-8 w-16 rounded-full sm:block" />
				</div>
			</Card>
		{/each}
	</div>
</div>
