<script lang="ts">
	import { untrack } from 'svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import * as Form from '@civicos/shared/ui/form';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { toPlaceSlug } from '@civicos/shared/data/place';
	import CharCount from '$lib/components/CharCount.svelte';
	import PlaceSelector from '$lib/components/place-selector/PlaceSelector.svelte';
	import { areasForIds, placeIdOf } from '$lib/components/place-selector/campaign-areas';
	import {
		createPlaceGeometrySource,
		createPlaceSource
	} from '$lib/components/place-selector/sources';
	import type { PlaceSchema } from './place-schema';

	interface Props {
		form: SuperForm<z.infer<PlaceSchema>>;
	}

	let { form }: Props = $props();
	// One superForm for the component's whole life, so its store is read once.
	const formData = untrack(() => form.form);

	const slug = $derived(toPlaceSlug($formData.name));

	const source = createPlaceSource();
	const geometrySource = createPlaceGeometrySource();
	// The selector owns the selection after mount, so it is seeded once.
	const initialIds = untrack(() => $formData.areas.map(placeIdOf));

	// Names resolve asynchronously, so a slow lookup must not overwrite a newer pick.
	let areasRequest = 0;
	async function onAreasChange(ids: string[]) {
		const request = ++areasRequest;
		const areas = await areasForIds(source, ids);
		if (request === areasRequest) $formData.areas = areas;
	}

	const inputClass =
		'w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2.5 text-body focus:border-primary focus:outline-none';
	const helpClass = 'text-caption text-muted-foreground';
	const errorClass = 'text-caption text-destructive';
</script>

<Form.Field {form} name="name" class="space-y-1.5">
	<Form.Control>
		{#snippet children({ props })}
			<div class="flex items-baseline justify-between gap-3">
				<Form.Label class="text-body font-medium">Name</Form.Label>
				{#if $formData.name.length}
					<CharCount count={$formData.name.length} limit={TEXT_LIMITS.placeName} />
				{/if}
			</div>
			<p class={helpClass}>What participants browse by, e.g. "Central Oregon".</p>
			<input
				{...props}
				bind:value={$formData.name}
				maxlength={TEXT_LIMITS.placeName}
				placeholder="e.g. Central Oregon"
				class={inputClass}
			/>
		{/snippet}
	</Form.Control>
	<Form.FieldErrors class={errorClass} />
	{#if slug}
		<p class={helpClass}>Slug: <span class="font-mono">{slug}</span></p>
	{/if}
</Form.Field>

<Form.Fieldset {form} name="areas" class="space-y-1.5">
	<Form.Legend class="text-body font-medium">Areas</Form.Legend>
	<p class={helpClass}>
		The states, counties and cities this Place covers. Picking a state or county does not pick the
		places inside it.
	</p>
	<Form.FieldErrors class={errorClass} />
	<PlaceSelector {source} {geometrySource} selectedIds={initialIds} onchange={onAreasChange} />
</Form.Fieldset>
