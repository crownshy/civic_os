<script lang="ts">
	import DemographicTable from '$lib/components/DemographicTable.svelte';
	import RegionMap from '$lib/components/RegionMap.svelte';
	import PollStatRow from '$lib/components/PollStatRow.svelte';
	import { zipCentroid } from '$lib/utils/zip-centroids';

	let { data } = $props();

	const region = $derived(data.region);
	const demographics = $derived(data.demographics);
	const error = $derived(data.error);

	// Region map center per state
	const mapCenter = $derived<[number, number]>(
		region.slug === 'utah'
			? [-111.66, 40.23]
			: region.slug === 'oregon'
				? [-121.0, 44.0]
				: [-98.5, 39.8]
	);
	const mapZoom = 3;

	// Total participants metric
	const totalParticipants = $derived(demographics?.totalParticipants ?? 0);
	// TODO: pipe a real goal from RegionConfig once exposed.
	const participantsGoal = 700;
	const participantsDelta = 0; // No historical compare available yet

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

	// Geography: aggregate zipcodeCounts → top 10 zips
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
		<div class="flex items-center gap-2 pb-6">
			<span class="text-foreground/70 text-caption pr-2 font-medium">Jump to:</span>
			<a href="#geography" class="bg-muted text-caption rounded-full px-3 py-1.5 font-medium"
				>Geography</a
			>
			<a href="#ethnicity" class="bg-muted text-caption rounded-full px-3 py-1.5 font-medium"
				>Race / Ethnicity</a
			>
			<a href="#gender" class="bg-muted text-caption rounded-full px-3 py-1.5 font-medium"
				>Gender</a
			>
			<a href="#political" class="bg-muted text-caption rounded-full px-3 py-1.5 font-medium"
				>Political Affiliation</a
			>
			<a href="#age" class="bg-muted text-caption rounded-full px-3 py-1.5 font-medium">Age</a>
		</div>

		<div class="space-y-8">
			<!-- Geography card: table + map -->
			<section
				id="geography"
				class="border-border shadow-card overflow-hidden rounded-2xl border bg-card"
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
					<button
						type="button"
						class="bg-muted text-destructive text-caption flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 font-medium"
					>
						Modify Goals
					</button>
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
						{#each geographyRows as row}
							<div
								class="text-caption grid grid-cols-[2fr_auto_auto] items-center gap-4 py-2.5"
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
							<div class="text-muted-foreground text-caption py-6">
								No zipcode data yet.
							</div>
						{/if}
					</div>

					<div class="bg-muted h-80 overflow-hidden rounded-xl">
						<RegionMap center={mapCenter} zoom={mapZoom} points={mapPoints} />
					</div>
				</div>
			</section>

			<!-- Race / Ethnicity -->
			<div id="ethnicity">
				<DemographicTable
					title="Race / Ethnicity"
					rows={ethnicityRows}
					total={totalEthnicity}
					participantCount={totalParticipants}
				/>
			</div>

			<!-- Gender -->
			<div id="gender">
				<DemographicTable
					title="Gender"
					rows={genderRows}
					total={totalGender}
					participantCount={totalParticipants}
				/>
			</div>

			<!-- Political Affiliation -->
			<div id="political">
				<DemographicTable
					title="Political Affiliation"
					rows={politicalRows}
					total={totalPolitical}
					participantCount={totalParticipants}
				/>
			</div>

			<!-- Age -->
			<div id="age">
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
