<script lang="ts">
	import DemographicTable from "$lib/components/DemographicTable.svelte";
	import RegionMap from "$lib/components/RegionMap.svelte";
	import PollStatRow from "$lib/components/PollStatRow.svelte";
	import EditGoalsModal from "$lib/components/EditGoalsModal.svelte";
	import { zipCentroid } from "$lib/utils/zip-centroids";
	import type { GoalMetric } from "$lib/config/representation-goals";
	import Card from "@civicos/shared/ui/Card.svelte";
	import { Button } from "@civicos/shared/ui/button";
	import { Download } from "@lucide/svelte";

	let { data } = $props();

	const region = $derived(data.region);
	const demographics = $derived(data.demographics);
	const goals = $derived(data.goals);
	const workflowId = $derived(data.workflowId);
	const conversationId = $derived(data.conversationId);
	const error = $derived(data.error);

	let modalOpen = $state(false);
	let modalMetric = $state<GoalMetric | null>(null);

	function openModal(metric: GoalMetric) {
		console.log("Opening modal");
		modalMetric = metric;
		modalOpen = true;
	}

	const mapCenter = $derived<[number, number]>(
		region.slug === "utah"
			? [-111.66, 40.23]
			: region.slug === "oregon"
				? [-121.0, 44.0]
				: [-98.5, 39.8],
	);
	const mapZoom = 3;

	const totalParticipants = $derived(demographics?.totalParticipants ?? 0);
	const participantsGoal = $derived(goals.totalParticipants);
	const participantsDelta = 0;

	function rowsFor(
		categories: { value?: string | null; count: number }[] | undefined,
		goalMap: Record<string, number>,
		fallbackLabel = "Not Provided",
	) {
		if (!categories || !categories.length) return [];
		return categories.map((c) => {
			const label = c.value || fallbackLabel;
			const goal = goalMap[label];
			return goal !== undefined
				? { label, count: c.count, goal }
				: { label, count: c.count };
		});
	}

	const ethnicityRows = $derived(
		rowsFor(demographics?.ethnicity, goals.ethnicity),
	);
	const genderRows = $derived(rowsFor(demographics?.gender, goals.gender));
	const politicalRows = $derived(
		rowsFor(demographics?.politicalParty, goals.politicalParty),
	);
	const ageRows = $derived(rowsFor(demographics?.ageRanges, goals.ageRanges));

	const geographyRows = $derived(
		Object.entries(demographics?.zipcodeCounts ?? {})
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([zip, count]) => ({ label: zip, count })),
	);

	const totalEthnicity = $derived(
		ethnicityRows.reduce((s, r) => s + r.count, 0),
	);
	const totalGender = $derived(genderRows.reduce((s, r) => s + r.count, 0));
	const totalPolitical = $derived(
		politicalRows.reduce((s, r) => s + r.count, 0),
	);
	const totalAge = $derived(ageRows.reduce((s, r) => s + r.count, 0));
	const totalGeography = $derived(
		geographyRows.reduce((s, r) => s + r.count, 0),
	);

	const mapPoints = $derived(
		Object.entries(demographics?.zipcodeCounts ?? {}).map(([zip, count]) => ({
			coord: zipCentroid(zip),
			count,
			label: zip,
		})),
	);

	const jumpLinks = [
		{ href: "#geography", label: "Geography" },
		{ href: "#ethnicity", label: "Race / Ethnicity" },
		{ href: "#gender", label: "Gender" },
		{ href: "#political", label: "Political Affiliation" },
		{ href: "#age", label: "Age" },
	];

	const currentGoals = $derived(
		modalMetric && modalMetric !== "totalParticipants"
			? goals[modalMetric]
			: {},
	);
</script>

{#if error}
	<div class="text-destructive text-caption p-8">
		Failed to load participants: {error}
	</div>
{:else if !demographics}
	<div class="text-muted-foreground text-caption p-8">
		Loading participants…
	</div>
{:else}
	<div class="flex-1 overflow-y-auto px-8 py-8">
		<!-- Hero metric row -->
		<div class="flex flex-wrap items-end justify-between gap-4 pb-8">
			<PollStatRow
				stats={[
					{
						label: "Total Participants",
						value: totalParticipants,
						accent:
							participantsDelta > 0 ? ` (+${participantsDelta})` : undefined,
					},
					{
						label: "Goal",
						value: participantsGoal || "—",
						action: {
							label: "MODIFY",
							onclick: () => openModal("totalParticipants"),
						},
					},
				]}
			/>
			<Button
				href={`/api/conversation/${conversationId}/demographics/export`}
				download={`conversation-demographics-${new Date().toISOString().slice(0, 10)}.csv`}
			>
				<Download class="size-4" />
				Download Demographics
			</Button>
		</div>

		<!-- Jump-to pills -->
		<div
			class="bg-background/85 sticky top-0 z-10 -mx-8 flex flex-wrap items-center gap-2 px-8 py-3 backdrop-blur"
		>
			<span class="text-foreground/70 text-body pr-2 font-medium">Jump to:</span>
			{#each jumpLinks as link (link.href)}
				<a
					href={link.href}
					class="bg-muted text-body inline-flex cursor-pointer items-center rounded-[30px] px-3 py-2 font-medium transition-all duration-150 hover:scale-[1.04] hover:shadow-sm active:scale-[0.97]"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="space-y-8">
			<!-- Geography card: table + map (no goals — zipcode buckets are open-ended) -->
			<div id="geography" class="scroll-mt-4">
				<Card
					class="hover:border-muted-foreground/40 shadow-card rounded-[20px] transition-colors duration-200"
				>
					<header class="flex items-start justify-between gap-4 px-8 pt-8 pb-2">
						<div>
							<h2 class="font-display text-display font-semibold">Geography</h2>
							<p class="text-section mt-1">
								<span class="font-medium">n = {totalGeography}</span>
								{#if totalParticipants}
									<span class="text-foreground/50 font-medium"
										>({Math.round((totalGeography / totalParticipants) * 100)}%
										of respondents)</span
									>
								{/if}
							</p>
						</div>
					</header>
					<div class="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-2">
						<div class="divide-border divide-y">
							<div
								class="text-foreground/40 text-label font-ui grid grid-cols-[2fr_auto_auto] items-center gap-4 py-2 font-semibold uppercase"
							>
								<div>Zip Code</div>
								<div class="w-12 text-right">Count</div>
								<div class="w-20 text-right">% of total</div>
							</div>
							{#each geographyRows as row (row.label)}
								<div
									class="text-caption font-ui hover:bg-muted/40 grid grid-cols-[2fr_auto_auto] items-center gap-4 rounded-md px-1 py-2.5 transition-colors duration-150"
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
				</Card>
			</div>

			<div id="ethnicity" class="scroll-mt-4">
				<DemographicTable
					title="Race / Ethnicity"
					rows={ethnicityRows}
					total={totalEthnicity}
					participantCount={totalParticipants}
					onModifyGoals={() => openModal("ethnicity")}
				/>
			</div>

			<div id="gender" class="scroll-mt-4">
				<DemographicTable
					title="Gender"
					rows={genderRows}
					total={totalGender}
					participantCount={totalParticipants}
					onModifyGoals={() => openModal("gender")}
				/>
			</div>

			<div id="political" class="scroll-mt-4">
				<DemographicTable
					title="Political Affiliation"
					rows={politicalRows}
					total={totalPolitical}
					participantCount={totalParticipants}
					onModifyGoals={() => openModal("politicalParty")}
				/>
			</div>

			<div id="age" class="scroll-mt-4">
				<DemographicTable
					title="Age"
					rows={ageRows}
					total={totalAge}
					participantCount={totalParticipants}
					onModifyGoals={() => openModal("ageRanges")}
				/>
			</div>
		</div>
	</div>

	<EditGoalsModal
		bind:open={modalOpen}
		metric={modalMetric}
		currentGoals={currentGoals as Record<string, number>}
		totalGoal={participantsGoal}
		{conversationId}
		{workflowId}
	/>
{/if}
