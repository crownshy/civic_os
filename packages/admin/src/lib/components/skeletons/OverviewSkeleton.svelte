<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors overview/+page.svelte: the "Settings" heading and the stack of
	// label + card read-only setting rows, ending with the danger-zone card.
</script>

<div class="flex-1 space-y-5 overflow-y-auto px-5 py-5" aria-hidden="true">
	<Skeleton class="h-4 w-20" />

	{#each Array(5) as _, i (i)}
		<div class="space-y-1">
			<Skeleton class="h-3 w-24" />
			<Card>
				<div class="px-3 py-3">
					<Skeleton class="h-4 w-2/3" />
				</div>
			</Card>
		</div>
	{/each}

	<div class="border-border my-4 border-t"></div>

	<Card class="border-destructive/30">
		<div class="flex items-center justify-between gap-3 px-4 py-3.5">
			<div class="space-y-1.5">
				<Skeleton class="h-3 w-28" />
				<Skeleton class="h-3 w-64" />
			</div>
			<Skeleton class="h-8 w-40 rounded-full" />
		</div>
	</Card>
</div>
