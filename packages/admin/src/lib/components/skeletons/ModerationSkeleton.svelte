<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors moderation/+page.svelte: heading, add-statement card, filter chips
	// and the statements list.
</script>

<div class="flex flex-col gap-6 px-8 py-8" aria-hidden="true">
	<!-- Heading -->
	<div class="flex flex-col gap-2">
		<Skeleton class="h-6 w-56" />
		<Skeleton class="h-4 w-72 max-w-full" />
	</div>

	<!-- Add-a-statement card -->
	<Card class="bg-muted/40 max-w-3xl">
		<div class="flex items-center justify-between gap-3 px-4 py-3">
			<div class="flex flex-col gap-2">
				<Skeleton class="h-4 w-32" />
				<Skeleton class="h-3 w-56 max-w-full" />
			</div>
			<div class="flex shrink-0 gap-2">
				<Skeleton class="h-9 w-32 rounded-full" />
				<Skeleton class="h-9 w-28 rounded-full" />
			</div>
		</div>
	</Card>

	<!-- Filter chips -->
	<div class="flex flex-wrap gap-1.5">
		{#each Array(5) as _, i (i)}
			<Skeleton class="h-7 w-20 rounded-full" />
		{/each}
	</div>

	<!-- Statements list -->
	<div class="max-w-6xl">
		<Card class="shadow-card">
			<div class="flex flex-col gap-4 px-4 py-4">
				{#each Array(6) as _, i (i)}
					<div class="grid grid-cols-[1.5rem_minmax(0,1fr)_11rem_auto] items-center gap-4">
						<Skeleton class="h-4 w-4" />
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-40" />
						<Skeleton class="h-6 w-14" />
					</div>
				{/each}
			</div>
		</Card>
	</div>
</div>
