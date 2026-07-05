<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors participants/+page.svelte: hero metric row, jump-to pills, the
	// geography card (table + map) and a couple of demographic tables.
</script>

<div class="px-8 py-8" aria-hidden="true">
	<!-- Hero metric row -->
	<div class="flex items-end justify-between gap-4 pb-8">
		<div class="flex gap-10">
			{#each Array(2) as _, i (i)}
				<div class="flex flex-col gap-2">
					<Skeleton class="h-8 w-20" />
					<Skeleton class="h-3 w-24" />
				</div>
			{/each}
		</div>
		<Skeleton class="h-9 w-32" />
	</div>

	<!-- Jump-to pills -->
	<div class="flex flex-wrap items-center gap-2 py-3">
		<Skeleton class="h-4 w-14" />
		{#each Array(5) as _, i (i)}
			<Skeleton class="h-7 w-24 rounded-full" />
		{/each}
	</div>

	<div class="flex flex-col gap-8 pt-3">
		<!-- Geography card: table + map -->
		<Card class="shadow-card">
			<div class="flex flex-col gap-2 px-6 pt-6 pb-2">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-3 w-40" />
			</div>
			<div class="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-2">
				<div class="flex flex-col gap-3">
					{#each Array(6) as _, i (i)}
						<div class="grid grid-cols-[2fr_auto] items-center gap-4">
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-10" />
						</div>
					{/each}
				</div>
				<Skeleton class="h-80 w-full rounded-xl" />
			</div>
		</Card>

		<!-- Demographic tables -->
		{#each Array(2) as _, i (i)}
			<Card class="shadow-card">
				<div class="flex flex-col gap-2 px-6 pt-6 pb-2">
					<Skeleton class="h-5 w-40" />
					<Skeleton class="h-3 w-28" />
				</div>
				<div class="flex flex-col gap-3 px-6 pb-6">
					{#each Array(4) as _, j (j)}
						<div class="grid grid-cols-[2fr_1fr] items-center gap-4">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-full" />
						</div>
					{/each}
				</div>
			</Card>
		{/each}
	</div>
</div>
