<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { PillButton, MonoLabel } from '$lib/components/ui';
</script>

<AppShell>
	<div class="flex h-full flex-col items-center justify-center gap-6 bg-background px-8">
			<div class="mt-8 flex w-full max-w-md flex-col gap-3">
			<a href="/demo/landing">
				<PillButton fullWidth>LANDING (WITHOUT HOST)</PillButton>
			</a>
			<a href="/demo/landing?host=true">
				<PillButton fullWidth>LANDING (WITH HOST)</PillButton>
			</a>
	
			<a href="/demo/contribute">
				<PillButton fullWidth>CONTRIBUTE / VOTE</PillButton>
			</a>
					<a href="/demo/pop-quiz">
				<PillButton fullWidth>POP QUIZ</PillButton>
			</a>
			<a href="/demo/about-you">
				<PillButton fullWidth>ABOUT YOU</PillButton>
			</a>
			<a href="/demo/learn">
				<PillButton fullWidth>LEARNING (IN-FLOW)</PillButton>
			</a>
			<a href="/demo/deliberation">
				<PillButton fullWidth>DELIBERATION PAGE</PillButton>
			</a>
			<a href="/demo/profile">
				<PillButton fullWidth>PROFILE</PillButton>
			</a>
			<a href="/demo/report">
				<PillButton fullWidth>BLOOM REPORT</PillButton>
			</a>
		</div>
	</div>
</AppShell>
