<script lang="ts">
	import { GripVertical, MoreHorizontal, Plus } from '@lucide/svelte';

	// Default agenda — same for every event today. Phase 3: persist per event.
	const items = $state([
		{ title: 'Welcome & context (host)', minutes: 15 },
		{ title: 'Small-group breakouts', minutes: 30 },
		{ title: 'Share-out & themes', minutes: 25 },
		{ title: 'Closing reflection', minutes: 10 }
	]);
</script>

<div class="max-w-3xl space-y-4">
	<div class="flex items-end justify-between">
		<div>
			<h3 class="text-base font-bold">Agenda</h3>
			<p class="text-muted-foreground text-xs">
				Inherited from the conversation's default agenda. Drag to reorder.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="text-destructive/50 hover:text-destructive rounded-full px-3 py-1.5 text-xs"
			>
				reset to default
			</button>
			<button
				type="button"
				class="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
			>
				<Plus class="size-3" /> add item
			</button>
		</div>
	</div>

	<div class="space-y-2">
		{#each items as item, i (i)}
			<div
				class="bg-muted/30 border-foreground/20 flex items-center gap-2.5 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl border px-3 py-2.5"
			>
				<GripVertical class="text-muted-foreground size-4 cursor-grab" />
				<div class="flex-1 text-xs font-bold">{item.title}</div>
				<span
					class="bg-foreground/10 border-foreground/20 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl border px-2 py-1 text-xs"
				>
					{item.minutes} min
				</span>
				<button type="button" class="text-muted-foreground"
					><MoreHorizontal class="size-4" /></button
				>
			</div>
		{/each}
	</div>
</div>
