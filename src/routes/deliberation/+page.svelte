<script lang="ts">
	import { page } from '$app/state';
	import { AppShell } from '$lib/components/layout';
	import { Button, MonoLabel, ProgressBar, MapPlaceholder, Header } from '$lib/components/ui';
	import { county, themeSummaries } from '$lib/data/mock';
	import type { RegionConfig } from '$lib/config/regions';

	const region: RegionConfig = page.data.region;
</script>

<AppShell>
	<div class="flex flex-col bg-primary">
		<!-- Hero header -->
		<Header countyName={county.name} variant="on-primary" class="pb-6"></Header>

		<!-- Key question label + question -->
		<div class="bg-primary px-8 pb-4">
			<MonoLabel size="sm" variant="white">KEY QUESTION</MonoLabel>
			<h1
				class="mt-2 font-display text-3xl leading-9 font-medium tracking-display text-primary-foreground"
			>
				{region.question}
			</h1>
			<div class="mt-6">
				<Button variant="outline" fullWidth>SHARE YOUR THOUGHTS NOW</Button>
			</div>
		</div>

		<div class="w-full rounded-t-lg bg-card">
			<!-- Participant count -->
			<div class="px-8 pt-8">
				<h2 class="font-display text-4xl font-medium tracking-display text-primary">
					{county.participantCount} PARTICIPANTS
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
						<ProgressBar percentage={theme.percentage} variant="on-white" />
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
	</div></AppShell
>
