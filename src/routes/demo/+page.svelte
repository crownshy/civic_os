<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { PillButton, MonoLabel } from '$lib/components/ui';
</script>

<AppShell>
	<div class="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-8">
		<h1 class="text-center font-mono text-4xl font-medium text-primary-foreground">
			CIVIC OS
		</h1>
		<p class="text-center font-mono text-lg font-medium text-primary-foreground">
			DEMO SCREENS
		</p>

		<div class="mt-8 flex w-full max-w-md flex-col gap-3">
			<a href="/demo/invitation">
				<PillButton variant="filled-white" fullWidth>INVITATION / LANDING</PillButton>
			</a>
			<a href="/demo/onboarding">
				<PillButton variant="filled-white" fullWidth>ONBOARDING</PillButton>
			</a>
			<a href="/demo/onboarding?returning=true">
				<PillButton variant="filled-white" fullWidth>WELCOME BACK (RETURNING)</PillButton>
			</a>
			<a href="/demo/contribute">
				<PillButton variant="filled-white" fullWidth>CONTRIBUTE / VOTE</PillButton>
			</a>
			<a href="/demo/deliberation">
				<PillButton variant="filled-white" fullWidth>DELIBERATION PAGE</PillButton>
			</a>
			<a href="/demo/learn">
				<PillButton variant="filled-white" fullWidth>LEARNING (IN-FLOW)</PillButton>
			</a>
			<a href="/demo/profile">
				<PillButton variant="filled-white" fullWidth>PROFILE</PillButton>
			</a>
			<a href="/demo/report">
				<PillButton variant="filled-white" fullWidth>BLOOM REPORT</PillButton>
			</a>
		</div>
	</div>
</AppShell>
