<script lang="ts">
	import DemographicTable from '$lib/components/DemographicTable.svelte';
	import RegionMap from '$lib/components/RegionMap.svelte';
	import PollStatRow from '$lib/components/PollStatRow.svelte';
	import { zipCentroid } from '$lib/utils/zip-centroids';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Pencil } from '@lucide/svelte';

	let { data } = $props();

	const region = $derived(data.region);
	const demographics = $derived(data.demographics);
	const error = $derived(data.error);

	const mapCenter = $derived<[number, number]>(
		region.slug === 'utah'
			? [-111.66, 40.23]
			: region.slug === 'oregon'
				? [-121.0, 44.0]
				: [-98.5, 39.8]
	);
	const mapZoom = 3;

	const totalParticipants = $derived(demographics?.totalParticipants ?? 0);
	const participantsGoal = 700;
	const participantsDelta = 0;

	function rowsFor(
		categories: { value?: string | null; count: number }[] | undefined,
		fallbackLabel = 'Not Provided'
	) {
		if (!categories || !categories.length) return [];
		return categories.map((c) => ({
			label: c.value || fallbackLabel,
			count: c.count
		}));
	}

	const ethnicityRows = $derived(rowsFor(demographics?.ethnicity));
	const genderRows = $derived(rowsFor(demographics?.gender));
	const politicalRows = $derived(rowsFor(demographics?.politicalParty));
	const ageRows = $derived(rowsFor(demographics?.ageRanges));

	const geographyRows = $derived(
		Object.entries(demographics?.zipcodeCounts ?? {})
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([zip, count]) => ({ label: zip, count }))
	);

	const totalEthnicity = $derived(ethnicityRows.reduce((s, r) => s + r.count, 0));
	const totalGender = $derived(genderRows.reduce((s, r) => s + r.count, 0));
	const totalPolitical = $derived(politicalRows.reduce((s, r) => s + r.count, 0));
	const totalAge = $derived(ageRows.reduce((s, r) => s + r.count, 0));
	const totalGeography = $derived(geographyRows.reduce((s, r) => s + r.count, 0));

	const mapPoints = $derived(
		Object.entries(demographics?.zipcodeCounts ?? {}).map(([zip, count]) => ({
			coord: zipCentroid(zip),
			count,
			label: zip
		}))
	);

	const jumpLinks = [
		{ href: '#geography', label: 'Geography' },
		{ href: '#ethnicity', label: 'Race / Ethnicity' },
		{ href: '#gender', label: 'Gender' },
		{ href: '#political', label: 'Political Affiliation' },
		{ href: '#age', label: 'Age' }
	];
</script>

{#if error}
	<div class="text-destructive text-caption p-8">Failed to load participants: {error}</div>
{:else if !demographics}
	<div class="text-muted-foreground text-caption p-8">Loading participants…</div>
{:else}
	<div class="flex-1 overflow-y-auto px-8 py-8">
		<!-- Hero metric row -->
		<div class="pb-8">
			<PollStatRow
				stats={[
					{
						label: 'Total Participants',
						value: totalParticipants,
						accent: participantsDelta > 0 ? ` (+${participantsDelta})` : undefined
					},
					{ label: 'Goal', value: participantsGoal }
				]}
			/>
		</div>

		<!-- Jump-to pills -->
		<div
			class="bg-background/85 sticky top-0 z-10 -mx-8 flex flex-wrap items-center gap-2 px-8 py-3 backdrop-blur"
		>
			<span class="text-foreground/70 text-caption pr-2 font-medium">Jump to:</span>
			{#each jumpLinks as link (link.href)}
				<a
					href={link.href}
					class="bg-muted text-caption hover:bg-muted-foreground/20 inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 font-medium transition-all duration-150 hover:scale-[1.04] hover:shadow-sm active:scale-[0.97]"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="space-y-8">
			<!-- Geography card: table + map -->
			<div id="geography" class="scroll-mt-4">
			<Card
				class="hover:border-muted-foreground/40 shadow-card transition-colors duration-200"
			>
				<header class="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
					<div>
						<h2 class="text-section font-bold">Geography</h2>
						<p class="text-caption mt-1">
							<span class="font-medium">n = {totalGeography}</span>
							{#if totalParticipants}
								<span class="text-foreground/50 font-medium"
									>({Math.round(
										(totalGeography / totalParticipants) * 100
									)}% of respondents)</span
								>
							{/if}
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						class="bg-muted border-transparent text-destructive hover:bg-muted-foreground/20 hover:border-destructive/40 rounded-full transition-all hover:scale-105 active:scale-95"
					>
						<Pencil class="size-3.5" />
						Modify Goals
					</Button>
				</header>
				<div class="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-2">
					<div class="divide-border divide-y">
						<div
							class="text-foreground/40 text-label grid grid-cols-[2fr_auto_auto] items-center gap-4 py-2 font-semibold uppercase"
						>
							<div>Zip Code</div>
							<div class="w-12 text-right">Count</div>
							<div class="w-20 text-right">% of total</div>
						</div>
						{#each geographyRows as row (row.label)}
							<div
								class="text-caption hover:bg-muted/40 grid grid-cols-[2fr_auto_auto] items-center gap-4 rounded-md px-1 py-2.5 transition-colors duration-150"
							>
								<div class="truncate font-semibold">{row.label}</div>
								<div class="w-12 text-right font-semibold">{row.count}</div>
								<div class="w-20 text-right font-semibold">
									{totalGeography
										? Math.round((row.count / totalGeography) * 100)
										: 0}%
								</div>
							</div>
						{/each}
						{#if !geographyRows.length}
							<div class="text-muted-foreground text-caption py-6">No zipcode data yet.</div>
						{/if}
					</div>

					<div class="bg-muted h-80 overflow-hidden rounded-xl">
						<RegionMap center={mapCenter} zoom={mapZoom} points={mapPoints} />
					</div>
				</div>
			</Card>
			</div>

			<div id="ethnicity" class="scroll-mt-4">
				<DemographicTable
					title="Race / Ethnicity"
					rows={ethnicityRows}
					total={totalEthnicity}
					participantCount={totalParticipants}
				/>
			</div>

			<div id="gender" class="scroll-mt-4">
				<DemographicTable
					title="Gender"
					rows={genderRows}
					total={totalGender}
					participantCount={totalParticipants}
				/>
			</div>

			<div id="political" class="scroll-mt-4">
				<DemographicTable
					title="Political Affiliation"
					rows={politicalRows}
					total={totalPolitical}
					participantCount={totalParticipants}
				/>
			</div>

			<div id="age" class="scroll-mt-4">
				<DemographicTable
					title="Age"
					rows={ageRows}
					total={totalAge}
					participantCount={totalParticipants}
				/>
			</div>
		</div>
	</div>
{/if}
