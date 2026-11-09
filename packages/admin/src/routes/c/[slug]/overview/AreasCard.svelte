<script lang="ts">
	import { untrack } from 'svelte';
	import type { CampaignArea } from '@civicos/shared/data/areas';
	import CheckIcon from '@lucide/svelte/icons/check';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import PlaceSelector from '$lib/components/place-selector/PlaceSelector.svelte';
	import { areasForIds, placeIdOf } from '$lib/components/place-selector/campaign-areas';
	import {
		createPlaceGeometrySource,
		createPlaceSource
	} from '$lib/components/place-selector/sources';

	interface Props {
		/** The areas stored on the Campaign. Read once, when the card mounts. */
		areas: CampaignArea[];
		/** Persist the whole selection. Called after every pick or removal. */
		onSave: (areas: CampaignArea[]) => Promise<void>;
	}

	let { areas, onSave }: Props = $props();

	const source = createPlaceSource();
	const geometrySource = createPlaceGeometrySource();
	// The selector owns the selection after mount, so later prop changes are not fed back.
	const initialIds = untrack(() => areas.map(placeIdOf));

	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let error = $state<string | null>(null);

	// Picks can arrive faster than saves land. Only the newest selection is written,
	// one save at a time, so an older write can never finish last and win.
	let pendingIds: string[] | null = null;
	let flushing = false;

	function save(ids: string[]) {
		pendingIds = ids;
		void flush();
	}

	async function flush() {
		if (flushing) return;
		flushing = true;
		while (pendingIds) {
			const ids = pendingIds;
			pendingIds = null;
			status = 'saving';
			try {
				await onSave(await areasForIds(source, ids));
				status = 'saved';
				error = null;
			} catch (e) {
				console.error('Failed to save the areas', e);
				status = 'error';
				error = e instanceof Error ? e.message : 'Could not save these places.';
			}
		}
		flushing = false;
	}
</script>

<SetupCard
	title="Where it runs"
	subtitle="The states, counties and cities this Campaign is for. Picking a state or county does not pick the places inside it."
>
	<PlaceSelector {source} {geometrySource} selectedIds={initialIds} onchange={save} />
	<p aria-live="polite" class="min-h-5 pt-3 text-caption">
		{#if status === 'error'}
			<span class="text-destructive">Couldn't save: {error}</span>
		{:else if status === 'saving'}
			<span class="text-muted-foreground">Saving…</span>
		{:else if status === 'saved'}
			<span class="inline-flex items-center gap-1 text-foreground">
				<CheckIcon class="size-3.5" aria-hidden="true" />
				Saved
			</span>
		{/if}
	</p>
</SetupCard>
