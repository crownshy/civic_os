<script lang="ts">
	import { AppShell } from '$lib/components/layout';
	import { Button, MonoLabel } from '$lib/components/ui';
</script>

<AppShell>
	<div class="flex h-full flex-col items-center justify-center gap-6 bg-background px-8">
			<div class="mt-8 flex w-full max-w-md flex-col gap-3">

			<a href="/demo/landing?host=true">
				<Button fullWidth>LANDING</Button>
			</a>
	
			<a href="/demo/contribute">
				<Button fullWidth>CONTRIBUTE / VOTE</Button>
			</a>
			<a href="/demo/pop-quiz">
				<Button fullWidth>POP QUIZ</Button>
			</a>
			<a href="/demo/about-you">
				<Button fullWidth>ABOUT YOU</Button>
			</a>
			<a href="/demo/learn">
				<Button fullWidth>LEARNING (IN-FLOW)</Button>
			</a>
			<a href="/demo/report">
				<Button fullWidth>BLOOM REPORT</Button>
			</a>
		</div>
	</div>
</AppShell>
