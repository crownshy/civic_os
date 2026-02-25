<script lang="ts">
	import { AppShell, AppHeader } from '$lib/components/layout';
	import { PillButton, MonoLabel, ThemeChip, ProgressBar, MapPlaceholder } from '$lib/components/ui';
	import { county, deliberation, themeSummaries } from '$lib/data/mock';
</script>

<AppShell>
	<div class="flex flex-col bg-primary">
		<!-- Hero header -->
		<AppHeader
			countyName={county.name}
			variant="on-primary"
			class="pb-6"
		>
		</AppHeader>

		<!-- Key question label + question -->
		<div class="bg-primary px-8 pb-4">
			<MonoLabel size="sm" variant="white">KEY QUESTION</MonoLabel>
			<h1 class="mt-2 font-sans text-3xl font-semibold leading-9 text-primary-foreground">
				{deliberation.question}
			</h1>
			<div class="mt-6">
				<PillButton variant="filled-white" fullWidth>
					SHARE YOUR THOUGHTS NOW
				</PillButton>
			</div>
		</div>

	<div class="rounded-t-lg bg-card w-full">
		<!-- Participant count -->
		<div class="px-8 pt-8">
			<h2 class="font-sans text-4xl font-bold text-primary">
				{deliberation.participantCount} PARTICIPANTS
			</h2>
			<MonoLabel size="sm" variant="primary" class="mt-1">
				THROUGHOUT {county.name}
			</MonoLabel>
		</div>

		<!-- Map -->
		<div class="px-6 pt-6">
			<MapPlaceholder />
		</div>

		<!-- Demographics bars -->
		<div class="px-8 pt-8">
			<MonoLabel size="sm" variant="primary">DEMOGRAPHICS</MonoLabel>
			<div class="mt-4 flex flex-col gap-4">
				{#each themeSummaries as theme}
					<ProgressBar
						percentage={theme.percentage}
						variant="on-white"
					/>
				{/each}
			</div>
		</div>

		<!-- Invite -->
		<div class="px-8 pt-8">
			<p class="font-mono text-sm font-medium text-primary">
				THINK SOMEONE'S VOICE IS MISSING?
				<span class="underline">INVITE THEM!</span>
			</p>
		</div>

		<!-- Themes section -->
		<div class="px-8 pt-8">
			<MonoLabel size="md" variant="primary">
				HERE'S WHAT WE'RE TALKING ABOUT...
			</MonoLabel>
			<div class="mt-4 grid grid-cols-2 gap-3">
				{#each deliberation.topics as topic}
					<ThemeChip label={topic} />
				{/each}
			</div>
		</div>

		<!-- Where we agree / disagree -->
		<div class="px-8 pt-8">
			<MonoLabel size="md" variant="primary">WHERE WE AGREE</MonoLabel>
			<div class="mt-2 flex flex-col gap-1">
				<p class="font-mono text-sm font-medium text-primary">Lorem ipsum dolor sit amet</p>
				<p class="font-mono text-sm font-medium text-primary">Lorem ipsum dolor sit amet</p>
				<p class="font-mono text-sm font-medium text-primary">Lorem ipsum dolor sit amet</p>
			</div>
		</div>

		<div class="px-8 pt-8 pb-12">
			<MonoLabel size="md" variant="primary">WHERE WE DISAGREE</MonoLabel>
			<div class="mt-2 flex flex-col gap-1">
				<p class="font-mono text-sm font-medium text-primary">Lorem ipsum dolor sit amet</p>
				<p class="font-mono text-sm font-medium text-primary">Lorem ipsum dolor sit amet</p>
				<p class="font-mono text-sm font-medium text-primary">Lorem ipsum dolor sit amet</p>
			</div>
		</div>
	</div>
</AppShell>
