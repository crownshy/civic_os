<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import HeroSection from './HeroSection.svelte';
	import CommonGroundSection from './CommonGroundSection.svelte';
	import DemographicsSection from './DemographicsSection.svelte';
	import OpinionGroupsSection from './OpinionGroupsSection.svelte';
	import ConsensusSection from './ConsensusSection.svelte';
	import NextStepsSection from './NextStepsSection.svelte';
	import EmailSignupSection from './EmailSignupSection.svelte';
	import FloatingNavPill from './FloatingNavPill.svelte';
	import type { RegionConfig } from '$lib/config/regions';
	import type { WikiPollReport } from '$lib/types/report';

	const report: WikiPollReport | null = $derived(page.data.report);
	const demographics = $derived(page.data.demographics ?? null);
	const error: string | null = $derived(page.data.error ?? null);
	const region: RegionConfig = page.data.region;

	const participantCount = $derived(report?.groups?.reduce((a, b) => a + b.total_members, 0) ?? 0);
	const statementCount = $derived(report?.comments?.length ?? 0);
	const totalVotes = $derived(
		report?.comments?.reduce(
			(
				sum: number,
				c: { overall_votes: { agrees: number; disagrees: number; passes: number } }
			) => {
				const v = c.overall_votes;
				return sum + v.agrees + v.disagrees + v.passes;
			},
			0
		) ?? 0
	);
	const groupLabels = $derived(
		report?.groups?.map((_: unknown, i: number) => `Group ${String.fromCharCode(65 + i)}`) ?? []
	);

	const heroTitle = 'AI and the Future of Our Communities';
	const heroRegion = region?.stateName?.toUpperCase() || '';
	const heroPhase = 'PHASE 1: IDEAS REPORT';
	const heroDescription =
		'This is what this poll is about. Write a few sentence to describe what this topic is about, why is it important. Maybe in a very high-level, summarise how it went.';

	const sectionIds = [
		'hero',
		'common-ground',
		'demographics',
		'opinion-groups',
		'consensus',
		'next-steps'
	] as const;

	const sectionPillText: Record<string, string> = {
		hero: "Let's dive in... 👇🏾",
		'common-ground': 'Demographics 👇🏾',
		demographics: 'Opinion Groups 👇🏾',
		'opinion-groups': 'Consensus 👇🏾',
		consensus: "What's Next 👇🏾"
	};

	let currentSection = $state<string>('hero');
	let scrollContainer = $state<HTMLDivElement>();

	const pillText = $derived(sectionPillText[currentSection] ?? '');
	const pillVisible = $derived(currentSection !== 'next-steps');

	function scrollToNextSection() {
		const idx = sectionIds.indexOf(currentSection as (typeof sectionIds)[number]);
		if (idx < sectionIds.length - 1) {
			const nextId = sectionIds[idx + 1];
			const el = document.getElementById(nextId);
			el?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function handleScroll() {
		if (!scrollContainer) return;
		const scrollTop = scrollContainer.scrollTop;
		const viewportHeight = scrollContainer.clientHeight;

		for (let i = sectionIds.length - 1; i >= 0; i--) {
			const el = document.getElementById(sectionIds[i]);
			if (el) {
				const offsetTop = el.offsetTop;
				if (scrollTop + viewportHeight / 3 >= offsetTop) {
					currentSection = sectionIds[i];
					break;
				}
			}
		}
	}
</script>

<AppShell class="overflow-y-hidden!">
	{#if error || !report}
		<!-- Error state -->
		<div class="flex h-full flex-col items-center justify-center gap-6 px-8">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<span class="text-2xl">!</span>
			</div>
			<h2 class="text-center font-display text-2xl font-medium tracking-display text-foreground">
				Report data unavailable
			</h2>
			<p class="max-w-md text-center font-sans text-sm text-muted-foreground">
				{error || 'Could not load report data from the server.'}
			</p>
			<div class="mt-2 rounded-lg bg-muted px-4 py-3">
				<p class="font-mono text-xs text-muted-foreground">
					Check the server terminal for [Report] logs.
				</p>
			</div>
			<button
				onclick={() => location.reload()}
				class="mt-4 rounded-full bg-primary px-6 py-2 font-mono text-sm text-primary-foreground"
			>
				RETRY
			</button>
		</div>
	{:else}
		<!-- Report content -->
		<div
			bind:this={scrollContainer}
			onscroll={handleScroll}
			class="h-full overflow-x-hidden overflow-y-auto"
		>
			<div id="hero">
				<HeroSection
					title={heroTitle}
					region={heroRegion}
					phase={heroPhase}
					description={heroDescription}
				/>
			</div>

			<div id="common-ground">
				<CommonGroundSection
					{participantCount}
					statements={report.comments}
					regionName={region?.stateName || 'Utah'}
				/>
			</div>

			<div id="demographics">
				<DemographicsSection {demographics} {participantCount} />
			</div>

			<div id="opinion-groups">
				<OpinionGroupsSection
					statements={report.comments}
					groups={report.groups}
					{totalVotes}
					{statementCount}
					{groupLabels}
				/>
			</div>

			<div id="consensus">
				<ConsensusSection statements={report.comments} />
			</div>

			<div id="next-steps">
				<NextStepsSection />
				<EmailSignupSection />
			</div>
		</div>

		<FloatingNavPill text={pillText} visible={pillVisible} onclick={scrollToNextSection} />
	{/if}
</AppShell>
