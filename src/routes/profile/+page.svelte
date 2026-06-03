<script lang="ts">
	import { AppShell, AppHeader } from '$lib/components/layout';
	import { MonoLabel, AlertBanner, ContributionRow, ConversationCard } from '$lib/components/ui';
	import { county, userProfile, conversations } from '$lib/data/mock';
</script>

<AppShell>
	<div class="flex flex-col bg-card">
		<!-- Header -->
		<div class="bg-primary px-8 pt-6 pb-4">
			<div class="flex items-center justify-between">
				<MonoLabel size="sm" variant="white">{county.name}</MonoLabel>
				<span class="flex items-center gap-2">
					<span class="h-3 w-3 rounded-full bg-primary-foreground"></span>
					<MonoLabel size="sm" variant="white">YOU</MonoLabel>
				</span>
			</div>

			<h1
				class="mt-4 font-display text-3xl leading-9 font-medium tracking-display text-primary-foreground"
			>
				PROFILE
			</h1>

			<!-- User card -->
			<div class="mt-4 flex items-center gap-4 rounded-2xl bg-card p-4">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground"
				>
					🦊
				</div>
				<div>
					<p class="font-mono text-sm font-medium text-primary">
						{userProfile.alias}
						(<span class="underline">change</span>)
					</p>
					<p class="font-mono text-sm font-medium text-primary">
						{userProfile.email}
					</p>
				</div>
			</div>
		</div>

		<!-- Email verification alert -->
		{#if !userProfile.emailVerified}
			<div class="px-5 pt-4">
				<AlertBanner message="You have not verified your email yet! Click here to complete." />
			</div>
		{/if}

		<!-- Your Information -->
		<div class="px-8 pt-6">
			<MonoLabel size="md" variant="primary">
				YOUR INFORMATION <span class="text-sm">(CHANGE)</span>
			</MonoLabel>
			<div class="mt-2 flex flex-col gap-1">
				<p class="font-mono text-sm font-medium text-primary">Zip Code</p>
				<p class="font-mono text-sm font-medium text-primary">Ethnicity</p>
				<p class="font-mono text-sm font-medium text-primary">Other identifiers?</p>
			</div>
		</div>

		<!-- Your Contributions -->
		<div class="px-8 pt-6">
			<MonoLabel size="md" variant="primary">YOUR CONTRIBUTIONS</MonoLabel>
			<div class="mt-1 flex flex-col gap-0.5">
				<p class="font-mono text-sm font-medium text-primary">DELIBERATION 001</p>
				<p class="font-mono text-sm font-medium text-primary">DELIBERATION 002</p>
			</div>
		</div>

		<!-- Recent Contributions -->
		<div class="pt-4">
			<div class="px-8">
				<MonoLabel size="sm" variant="primary">RECENT CONTRIBUTIONS</MonoLabel>
			</div>
			<div class="mt-2">
				<ContributionRow
					text="Social media companies should be held more accountable."
					meta="DELIBERATION 01"
					onDelete={() => {}}
				/>
				<ContributionRow
					text="We need mandatory digital literacy classes in schools."
					meta="DELIBERATION 01"
					onDelete={() => {}}
				/>
			</div>
		</div>

		<!-- Conversations -->
		<div class="px-8 pt-6 pb-8">
			<MonoLabel size="md" variant="primary">CONVERSATIONS</MonoLabel>
			<div class="mt-3 flex flex-col gap-3">
				{#each conversations as conv}
					<ConversationCard conversation={conv} />
				{/each}
			</div>
		</div>
	</div>
</AppShell>
