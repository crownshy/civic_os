<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
</script>

<section class="relative overflow-hidden bg-background py-6">
	<div class="px-8">
		<h2 class="font-sans text-3xl leading-8 font-bold text-foreground">
			Want to get involved? Here's where the conversation is going next...
		</h2>
	</div>

	<p class="mt-5 px-8 font-sans text-base font-medium text-foreground">
		Or, <span class="text-destructive">visit the homepage</span> for the broader AI & Our Communities
		initiative to learn more.
	</p>

	<!-- CTA Card -->
	<div
		class="mx-6 mt-10 overflow-hidden rounded-[10px] bg-card outline outline-1 outline-offset-[-1px] outline-foreground/20"
	>
		<!-- Left border accent -->
		<div class="relative pt-3 pl-6">
			<div class="absolute top-6 left-6 h-48 w-0.5 bg-foreground"></div>

			<!-- Status dot -->
			<div class="relative ml-[-11px]">
				<div
					class="absolute h-6 w-6 rounded-full bg-background/20 opacity-20 shadow-[0px_0px_11.3px_4px_var(--primary)]"
				></div>
				<div class="absolute top-1 left-1 h-4 w-4 rounded-full bg-primary"></div>
			</div>

			<div class="mt-[-2px] ml-6">
				<span class="font-mono text-xs font-medium text-destructive">NEXT STEP</span>
			</div>
		</div>

		<div class="px-11 pt-1 pb-5">
			<h3 class="font-sans text-3xl leading-[48px] font-bold text-primary">Listen & Learn</h3>
			<p class="mt-1 font-sans text-sm leading-5 font-medium text-foreground">
				An opportunity for people to share their thoughts on how artificial intelligence should be
				managed to protect people's livelihoods.
			</p>

			<div class="mt-6">
				<Button variant="primary" fullWidth>JOIN THE CONVERSATION →</Button>
			</div>
		</div>
	</div>
</section>
