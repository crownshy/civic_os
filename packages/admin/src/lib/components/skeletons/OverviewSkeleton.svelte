<script lang="ts">
	import Card from '@civicos/shared/ui/Card.svelte';
	import Skeleton from './Skeleton.svelte';

	// Mirrors overview/+page.svelte: the Identity card, then the stack of
	// SetupCards (Co-Hosts, Demographics, Participant Asks, Context, FAQ), then
	// the danger zone. Row counts match what a Campaign actually lands on:
	// 8 colour swatches, 4 participant asks; co-hosts, demographics and FAQ vary,
	// so those are sketched at a plausible length.
</script>

{#snippet field(labelWidth: string, valueClass: string)}
	<div class="min-w-0 space-y-1.5">
		<Skeleton class="h-3.5 {labelWidth}" />
		<Skeleton class={valueClass} />
	</div>
{/snippet}

<!-- SetupCard's header: an H3-scale title over an optional body-copy subtitle. -->
{#snippet cardHeader(titleWidth: string, subtitleWidth: string)}
	<header class="flex flex-col gap-2 px-8 pt-8">
		<Skeleton class="h-6 {titleWidth} md:h-8" />
		<Skeleton class="h-4 {subtitleWidth} max-w-full" />
	</header>
{/snippet}

<!-- The name / detail / status column strip shared by the toggle and FAQ tables. -->
{#snippet columnHeaders(third: string)}
	<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-4 px-2 pb-2">
		<Skeleton class="h-3 w-16" />
		<Skeleton class="h-3 w-28" />
		<Skeleton class="h-3 {third} justify-self-end" />
	</div>
{/snippet}

{#snippet toggleRows(count: number)}
	<div class="divide-y divide-border">
		{#each Array(count), i (i)}
			<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 px-2 py-5">
				<Skeleton class="h-4 w-32" />
				<Skeleton class="h-4 w-full" />
				<div class="flex items-center gap-3">
					<Skeleton class="h-5 w-9 rounded-full" />
					<Skeleton class="h-4 w-7" />
				</div>
			</div>
		{/each}
	</div>
{/snippet}

{#snippet addNewRow()}
	<div class="border-t border-border px-2 py-4">
		<Skeleton class="h-4 w-24" />
	</div>
{/snippet}

<div class="flex-1 overflow-y-auto" aria-hidden="true">
	<div class="flex flex-col gap-6 px-4 pb-8 md:px-8">
		<!-- Auto-save status: idle on arrival, so it only holds its row height. -->
		<div class="min-h-4"></div>

		<!-- ===== Identity ===== -->
		<Card class="rounded-[20px] shadow-card">
			<div class="flex flex-col gap-6 px-8 py-8">
				{@render field('w-10', 'h-7 w-2/3')}

				<div class="flex flex-wrap gap-x-12 gap-y-6">
					{@render field('w-10', 'h-9 w-64')}
					{@render field('w-16', 'h-9 w-48')}
				</div>

				{@render field('w-24', 'h-5 w-3/4')}

				<div class="space-y-1.5">
					<Skeleton class="h-3.5 w-24" />
					<div class="flex flex-wrap items-center gap-4">
						{#each Array(8), i (i)}
							<Skeleton class="size-12 rounded-[10px]" />
						{/each}
					</div>
				</div>
			</div>
		</Card>

		<!-- ===== Co-Hosts ===== -->
		<Card class="rounded-[20px] shadow-card">
			{@render cardHeader('w-40', 'w-[28rem]')}
			<div class="px-8 pt-6 pb-8">
				<div
					class="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-4 px-2 pb-2"
				>
					<Skeleton class="h-3 w-16" />
					<Skeleton class="h-3 w-20" />
					<Skeleton class="h-3 w-28" />
					<div></div>
				</div>
				<div class="divide-y divide-border">
					{#each Array(2), i (i)}
						<div
							class="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-4 px-2 py-4"
						>
							<Skeleton class="h-4 w-40" />
							<Skeleton class="h-4 w-28" />
							<Skeleton class="h-4 w-32" />
							<div></div>
						</div>
					{/each}
				</div>
				{@render addNewRow()}
			</div>
		</Card>

		<!-- ===== Demographics ===== -->
		<Card class="rounded-[20px] shadow-card">
			{@render cardHeader('w-56', 'w-[36rem]')}
			<div class="px-8 pt-6 pb-8">
				{@render columnHeaders('w-12')}
				{@render toggleRows(5)}
				{@render addNewRow()}
			</div>
		</Card>

		<!-- ===== Participant Asks ===== -->
		<Card class="rounded-[20px] shadow-card">
			{@render cardHeader('w-64', 'w-[36rem]')}
			<div class="px-8 pt-6 pb-8">
				{@render columnHeaders('w-12')}
				{@render toggleRows(4)}
			</div>
		</Card>

		<!-- ===== Context for Participants ===== -->
		<Card class="rounded-[20px] shadow-card">
			{@render cardHeader('w-80', 'w-[30rem]')}
			<div class="flex flex-col gap-6 px-8 pt-6 pb-8">
				{@render field('w-32', 'h-28 w-full')}
				{@render field('w-36', 'h-24 w-full')}
			</div>
		</Card>

		<!-- ===== FAQ ===== -->
		<Card class="rounded-[20px] shadow-card">
			{@render cardHeader('w-20', 'w-[34rem]')}
			<div class="px-8 pt-6 pb-8">
				{@render columnHeaders('w-10')}
				<div class="divide-y divide-border">
					{#each Array(3), i (i)}
						<div
							class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-start gap-4 px-2 py-5"
						>
							<Skeleton class="h-4 w-40" />
							<Skeleton class="h-4 w-full" />
							<div class="flex items-center gap-3">
								{#each Array(4), j (j)}
									<Skeleton class="size-4" />
								{/each}
							</div>
						</div>
					{/each}
				</div>
				{@render addNewRow()}
			</div>
		</Card>

		<!-- Danger zone -->
		<Card class="rounded-[20px] border-destructive/30 bg-destructive/5">
			<div
				class="flex flex-col items-start gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8"
			>
				<div class="space-y-1.5">
					<Skeleton class="h-3.5 w-28" />
					<Skeleton class="h-3.5 w-72 max-w-full" />
				</div>
				<Skeleton class="h-8 w-52" />
			</div>
		</Card>
	</div>
</div>
