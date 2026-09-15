<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import SetupField from '$lib/components/setup/SetupField.svelte';
	import { BRAND_PRESETS } from '@civicos/shared/data/brand';

	interface Props {
		title: string;
		/** Host portion of the public URL, e.g. "bloomproject.us". */
		baseUrl: string;
		slug: string;
		keyQuestion: string;
		/** Place names shown as chips, e.g. ["Oregon"]. */
		places: string[];
		/** When provided, replaces the read-only title with an editable field. */
		titleField?: Snippet;
		/** When provided, replaces the read-only slug with an editable field. */
		slugField?: Snippet;
		/** When provided, replaces the read-only key question with an editable field. */
		keyQuestionField?: Snippet;
		/** When provided, replaces the read-only place chips with an editable field. */
		placeField?: Snippet;
		/**
		 * Id of the colour scheme this Campaign is on, from its stored Brand. Null
		 * when its primary is a colour no preset offers, or when it has no Brand
		 * yet, and then no swatch is ringed.
		 */
		presetId?: string | null;
		/** Persist a scheme. Omit to render the row read-only. */
		onSelectPreset?: (id: string) => Promise<void>;
		/**
		 * Way into the full Brand, rendered at the end of the swatch row. The six
		 * swatches are the quick path; everything a swatch does not reach lives
		 * behind this.
		 */
		brandAction?: Snippet;
	}

	let {
		title,
		baseUrl,
		slug,
		keyQuestion,
		places,
		titleField,
		slugField,
		keyQuestionField,
		placeField,
		presetId = null,
		onSelectPreset,
		brandAction
	}: Props = $props();

	// The selected swatch is read from the stored Brand, never held locally. It
	// used to be `$state(0)`, which is why every reload came back orange no
	// matter what had been picked (#428).
	//
	// A preset writes `primary`, so this row and the Brand card's Primary field
	// edit the same value: picking a swatch fills that field, and typing a colour
	// no preset offers clears the ring here.
	let pending = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function select(id: string) {
		if (!onSelectPreset || pending) return;
		pending = id;
		error = null;
		try {
			await onSelectPreset(id);
		} catch (e) {
			console.error('PatchConversationMetadata failed', e);
			error = e instanceof Error ? e.message : 'Could not save that colour scheme.';
		} finally {
			pending = null;
		}
	}
</script>

<Card
	class="rounded-[20px] shadow-card transition-colors duration-200 hover:border-muted-foreground/40"
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
				{#if slugField}
					{@render slugField()}
				{:else}
					<div class="text-body font-semibold">
						<span class="text-muted-foreground">{baseUrl}/</span>{slug}
					</div>
				{/if}
			</SetupField>

			<!-- Always rendered, so the row keeps its shape on a Campaign with no
			     places yet. -->
			<SetupField label="Place(s)">
				{#if placeField}
					{@render placeField()}
				{:else}
					<div class="flex min-h-9 flex-wrap items-center gap-2">
						{#each places as place (place)}
							<span
								class="rounded-[10px] bg-primary/5 px-2.5 py-1.5 text-caption font-medium text-primary"
							>
								{place}
							</span>
						{:else}
							<span class="text-body text-muted-foreground">None yet</span>
						{/each}
					</div>
				{/if}
			</SetupField>
		</div>

		<SetupField label="Key Question">
			{#if keyQuestionField}
				{@render keyQuestionField()}
			{:else}
				<div class="text-body">{keyQuestion}</div>
			{/if}
		</SetupField>

		<SetupField label="Color Scheme">
			<div class="flex flex-wrap items-center gap-4">
				{#each BRAND_PRESETS as option (option.id)}
					<button
						type="button"
						aria-label={option.label}
						aria-pressed={presetId === option.id}
						disabled={!onSelectPreset || !!pending}
						onclick={() => select(option.id)}
						style={`background-color: ${option.tokens.primary}`}
						class="size-12 rounded-[10px] border border-stone-300 transition-transform hover:scale-105 disabled:cursor-not-allowed {presetId ===
						option.id
							? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
							: ''} {pending === option.id ? 'animate-pulse' : ''}"
					></button>
				{/each}
				{#if brandAction}
					<div class="ml-auto">{@render brandAction()}</div>
				{/if}
			</div>
			{#if error}
				<p class="mt-2 text-caption text-destructive">{error}</p>
			{/if}
		</SetupField>
	</div>
</Card>
