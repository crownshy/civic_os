<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import SetupField from '$lib/components/setup/SetupField.svelte';

	interface Props {
		title: string;
		/** Host portion of the public URL, e.g. "oregon.bloomproject.us". */
		baseUrl: string;
		slug: string;
		keyQuestion: string;
		/** Place names shown as chips, e.g. ["Oregon"]. Provisioned by BLOOM (#351). */
		places: string[];
		/** When provided, replaces the read-only title with an editable field. */
		titleField?: Snippet;
	}

	let { title, baseUrl, slug, keyQuestion, places, titleField }: Props = $props();

	// Presentational shell only. Real theming (persisted, applied across the
	// participant surfaces) is #365; this just previews the picker affordance.
	const colorOptions = ['#C2410C', '#2563EB', '#16A34A', '#9333EA', '#DB2777', '#0891B2'];
	let selectedColor = $state(0);
</script>

<Card
	class="hover:border-muted-foreground/40 shadow-card rounded-[20px] transition-colors duration-200"
>
	<div class="flex flex-col gap-6 px-8 py-8">
		<SetupField label="Title">
			{#if titleField}
				{@render titleField()}
			{:else}
				<div class="font-display text-body-lg font-semibold">{title}</div>
			{/if}
		</SetupField>

		<div class="flex flex-wrap gap-x-12 gap-y-6">
			<SetupField label="Slug">
				<div class="text-body font-semibold">
					<span class="text-muted-foreground">{baseUrl}/</span>{slug}
				</div>
			</SetupField>

			{#if places.length}
				<SetupField label="Place(s)">
					<div class="flex flex-wrap items-center gap-2">
						{#each places as place (place)}
							<span
								class="bg-primary/5 text-primary text-caption rounded-[10px] px-2.5 py-1.5 font-medium"
							>
								{place}
							</span>
						{/each}
					</div>
				</SetupField>
			{/if}
		</div>

		<SetupField label="Key Question">
			<div class="text-body">{keyQuestion}</div>
		</SetupField>

		<SetupField label="Color Scheme">
			<div class="flex flex-wrap items-center gap-4">
				{#each colorOptions as color, i (color)}
					<button
						type="button"
						aria-label={`Color option ${i + 1}`}
						aria-pressed={selectedColor === i}
						onclick={() => (selectedColor = i)}
						style={`background-color: ${color}`}
						class="size-12 rounded-[10px] border border-stone-300 transition-transform hover:scale-105 {selectedColor ===
						i
							? 'ring-primary ring-offset-background ring-2 ring-offset-2'
							: ''}"
					></button>
				{/each}
			</div>
		</SetupField>
	</div>
</Card>
