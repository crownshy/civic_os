<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { cn } from '@civicos/shared/utils';
	import type { PlaceGeometrySource } from './geometry';
	import { PlaceSelectorState } from './place-selector.svelte';
	import type { PlaceSource } from './places';
	import PlaceChips from './PlaceChips.svelte';
	import PlaceMap from './PlaceMap.svelte';
	import PlacePicker from './PlacePicker.svelte';

	type Props = {
		/** Where the picker gets states, counties and cities. */
		source: PlaceSource;
		/** Where the map gets boundaries. */
		geometrySource: PlaceGeometrySource;
		/** The places picked when the selector opens. Later changes arrive through `onchange`. */
		selectedIds?: string[];
		onchange?: (selectedIds: string[]) => void;
		class?: string;
	};

	let { source, geometrySource, selectedIds = [], onchange, class: className }: Props = $props();

	// Built once: the selection lives here after the first render and is reported out.
	const selector = untrack(
		() => new PlaceSelectorState(source, selectedIds, (ids) => onchange?.(ids))
	);

	let hoveredId = $state<string | null>(null);
	let panel = $state<HTMLElement | null>(null);
	let editButton = $state<HTMLButtonElement | null>(null);

	onMount(() => {
		void selector.load();
	});

	async function openEdit() {
		selector.openEdit();
		await tick();
		panel?.querySelector<HTMLInputElement>('input')?.focus();
	}

	async function closeEdit() {
		hoveredId = null;
		selector.closeEdit();
		await tick();
		editButton?.focus();
	}
</script>

<!-- A container query, not a viewport one: the selector sits inside cards of any width. -->
<div class={cn('@container', className)}>
	<div
		class={cn(
			'grid overflow-hidden rounded-xl border border-border bg-card text-card-foreground',
			'grid-rows-[480px_320px] @min-[760px]:h-[620px] @min-[760px]:grid-cols-[400px_minmax(0,1fr)] @min-[760px]:grid-rows-1'
		)}
	>
		<section
			bind:this={panel}
			class="flex min-h-0 min-w-0 flex-col border-b border-border @min-[760px]:border-r @min-[760px]:border-b-0"
			aria-label="Places"
		>
			{#if selector.mode === 'edit'}
				<PlacePicker state={selector} ondone={closeEdit} onhover={(id) => (hoveredId = id)} />
			{:else}
				<PlaceChips
					state={selector}
					onedit={openEdit}
					onhover={(id) => (hoveredId = id)}
					bind:editButton
				/>
			{/if}
		</section>

		<div class="min-h-0 min-w-0">
			<PlaceMap state={selector} {geometrySource} {hoveredId} class="rounded-none border-0" />
		</div>
	</div>
</div>
