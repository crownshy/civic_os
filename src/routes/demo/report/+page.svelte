<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { PillButton, MonoLabel, QuoteText, ProgressBar } from '$lib/components/ui';
	import { themeSummaries } from '$lib/data/mock';
	import { county, deliberation } from '$lib/data/mock';

	const regions = ['REGION 1', 'REGION 2', 'REGION 3'];
</script>

<AppShell>
	<div class="flex h-dvh flex-col bg-primary">
		<!-- Scrollable content -->
		<div class="flex flex-1 flex-col overflow-y-auto">
			<!-- Title area -->
			<div class="flex flex-col items-center px-8 pt-20">
				<h1 class="text-center font-sans text-4xl font-bold text-primary-foreground">
					BLOOM REPORT
				</h1>
				<MonoLabel size="lg" variant="white" class="mt-4">SUMMARY</MonoLabel>
			</div>

			<!-- Stats bars -->
			<div class="mt-12 flex flex-col gap-4 px-8 pb-8">
				{#each themeSummaries as theme}
					<ProgressBar
						percentage={theme.percentage}
						variant="on-primary"
					/>
				{/each}
			</div>
		</div>

		<!-- Sticky bottom navigation -->
		<div class="shrink-0 bg-background px-8 py-6">
			<PillButton variant="outline" fullWidth class="mb-3">
				GO BACK
			</PillButton>
			{#each regions as region}
				<div class="mb-3">
					<PillButton variant="filled" fullWidth>
						CHECK OUT {region}
					</PillButton>
				</div>
			{/each}
		</div>
	</div>
</AppShell>
