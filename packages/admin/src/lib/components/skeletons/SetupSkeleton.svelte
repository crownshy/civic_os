<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors open-poll/setup/+page.svelte: a stack of SetupCards, each a heading
	// plus a subtitle line over a body block.
</script>

<div class="flex flex-col gap-6 px-8 py-8" aria-hidden="true">
	{#each Array(4), i (i)}
		<Card class="rounded-[20px] shadow-card">
			<div class="flex flex-col gap-6 px-8 py-8">
				<div class="flex flex-col gap-2">
					<Skeleton class="h-7 w-64" />
					<Skeleton class="h-4 w-96 max-w-full" />
				</div>
				<Skeleton class="h-24 w-full" />
			</div>
		</Card>
	{/each}
</div>
