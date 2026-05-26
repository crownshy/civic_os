<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
</script>

<section class="relative overflow-hidden bg-background py-6">
	<div class="px-8">
		<h2 class="font-display tracking-display text-3xl font-medium leading-8 text-foreground">
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
		<div class="relative pl-6 pt-3">
			<div class="absolute left-6 top-6 h-48 w-0.5 bg-foreground"></div>

			<!-- Status dot -->
			<div class="relative ml-[-11px]">
				<div
					class="absolute h-6 w-6 rounded-full bg-background/20 opacity-20 shadow-[0px_0px_11.3px_4px_var(--primary)]"
				></div>
				<div class="absolute left-1 top-1 h-4 w-4 rounded-full bg-primary"></div>
			</div>

			<div class="ml-6 mt-[-2px]">
				<span class="font-mono text-xs font-medium text-destructive">NEXT STEP</span>
			</div>
		</div>

		<div class="px-11 pb-5 pt-1">
			<h3 class="font-display tracking-display text-3xl font-medium leading-[48px] text-primary">Listen & Learn</h3>
			<p class="mt-1 font-sans text-sm font-medium leading-5 text-foreground">
				An opportunity for people to share their thoughts on how artificial intelligence should be
				managed to protect people's livelihoods.
			</p>

			<div class="mt-6">
				<Button variant="primary" fullWidth>
					JOIN THE CONVERSATION →
				</Button>
			</div>
		</div>
	</div>
</section>
