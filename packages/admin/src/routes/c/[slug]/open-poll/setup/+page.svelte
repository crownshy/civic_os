<script lang="ts">
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
</script>

<!--
	Open Poll Setup (#354). Scaffold only: the four cards are empty shells that
	each land wired in their own PR, in this order:

	  Status:        stats + turn the poll off (conversation `is_live`)
	  Context:       Additional Context / What's Next, via the translations path
	  Seed:          PolisPostSeed + PolisModerateStatementAux
	  Demographics:  four booleans in `conversation.metadata`

	Nothing here reaches a participant until civicos reads its conversation from
	the API (#398).
-->
<div class="mx-auto flex max-w-6xl flex-col gap-6 px-8 py-8">
	<SetupCard title="Open Poll status">
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>

	<SetupCard
		title="Context for Participants"
		subtitle="Shown on the homepage for this conversation."
	>
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>

	<SetupCard
		title="Seed Statements"
		subtitle="These statements will be shown to most participants for review. As your community adds statements, old statements will show up less often."
	>
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>

	<SetupCard
		title="Demographics Questions"
		subtitle="Select from your active demographic categories."
	>
		<p class="text-muted-foreground text-body">Coming next.</p>
	</SetupCard>
</div>
