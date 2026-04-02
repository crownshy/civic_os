<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { mockReport, reportConfig } from '$lib/data/report-mock';
	import HeroSection from './HeroSection.svelte';
	import CommonGroundSection from './CommonGroundSection.svelte';
	import DemographicsSection from './DemographicsSection.svelte';
	import OpinionGroupsSection from './OpinionGroupsSection.svelte';
	import ConsensusSection from './ConsensusSection.svelte';
	import NextStepsSection from './NextStepsSection.svelte';
	import EmailSignupSection from './EmailSignupSection.svelte';
	import FloatingNavPill from './FloatingNavPill.svelte';

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
		consensus: "What's Next 👇🏾",
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
	<div
		bind:this={scrollContainer}
		onscroll={handleScroll}
		class="h-full overflow-y-auto overflow-x-hidden"
	>
		<div id="hero">
			<HeroSection
				title={reportConfig.title}
				region={reportConfig.region}
				phase={reportConfig.phase}
				description={reportConfig.description}
			/>
		</div>


		<div id="common-ground">
			<CommonGroundSection
				participantCount={reportConfig.participantCount}
				statements={mockReport.comments}
			/>
		</div>

		<div id="demographics">
			<DemographicsSection />
		</div>

		<div id="opinion-groups">
			<OpinionGroupsSection
				statements={mockReport.comments}
				groups={mockReport.groups}
				totalVotes={reportConfig.totalVotes}
				statementCount={reportConfig.statementCount}
				groupLabels={reportConfig.groupLabels}
			/>
		</div>

		<div id="consensus">
			<ConsensusSection statements={mockReport.comments} />
		</div>

		<div id="next-steps">
			<NextStepsSection />
			<EmailSignupSection />
		</div>
	</div>

	<FloatingNavPill text={pillText} visible={pillVisible} onclick={scrollToNextSection} />
</AppShell>
