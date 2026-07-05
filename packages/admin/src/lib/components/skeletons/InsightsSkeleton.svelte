<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors insights/+page.svelte: top stats, a Themes card, then the
	// Consensus / Difference / Uncertainty statement sections.
</script>

<div class="flex flex-col gap-10 px-8 py-8" aria-hidden="true">
	<!-- Top stats + download button -->
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div class="flex gap-10">
			{#each Array(3) as _, i (i)}
				<div class="flex flex-col gap-2">
					<Skeleton class="h-8 w-16" />
					<Skeleton class="h-3 w-24" />
				</div>
			{/each}
		</div>
		<Skeleton class="h-9 w-32" />
	</div>

	<!-- Themes card -->
	<Card class="bg-card shadow-card">
		<div class="flex items-start justify-between gap-4 px-6 pt-6">
			<div class="flex flex-col gap-2">
				<Skeleton class="h-5 w-28" />
				<Skeleton class="h-3 w-48" />
			</div>
			<Skeleton class="h-6 w-40" />
		</div>
		<div class="flex flex-col gap-3 px-6 pt-6 pb-6">
			{#each Array(5) as _, i (i)}
				<div class="grid grid-cols-[10rem_1fr] items-center gap-6">
					<Skeleton class="h-4 w-32" />
					<Skeleton class="h-4 w-full" />
				</div>
			{/each}
		</div>
	</Card>

	<!-- Statement sections -->
	{#each Array(3) as _, i (i)}
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<Skeleton class="h-5 w-52" />
				<Skeleton class="h-3 w-80 max-w-full" />
			</div>
			<Card class="shadow-card">
				<div class="flex flex-col gap-4 px-4 py-4">
					{#each Array(3) as _, j (j)}
						<div class="grid grid-cols-[1.5rem_1fr_10rem] items-center gap-4">
							<Skeleton class="h-4 w-4" />
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-24" />
						</div>
					{/each}
				</div>
			</Card>
		</div>
	{/each}
</div>
