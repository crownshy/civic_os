<script lang="ts">
	import { tick } from 'svelte';
	import { X } from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { cn } from '@civicos/shared/utils';
	import { LEVEL_STYLE } from './levels';
	import type { PlaceSelectorState } from './place-selector.svelte';
	import type { Place } from './places';

	type Props = {
		state: PlaceSelectorState;
		onedit: () => void;
		/** The chip under the pointer or keyboard focus, so the map can highlight it. */
		onhover?: (id: string | null) => void;
		/** Bound so the selector can return focus here after Done. */
		editButton?: HTMLButtonElement | null;
	};

	let { state: selector, onedit, onhover, editButton = $bindable(null) }: Props = $props();

	let list = $state<HTMLUListElement | null>(null);

	async function remove(place: Place, event: MouseEvent) {
		const ids = selector.selectedIds;
		const index = ids.indexOf(place.id);
		const nextId = ids[index + 1] ?? ids[index - 1];
		onhover?.(null);
		selector.remove(place.id);
		// A keyboard press fires a click with no pointer detail. Keep focus in the list
		// rather than dropping it on the body when its button disappears.
		if (event.detail !== 0) return;
		await tick();
		const next = nextId && list?.querySelector<HTMLButtonElement>(`[data-remove="${nextId}"]`);
		(next || editButton)?.focus();
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="flex items-center justify-between px-5 pt-5 pb-3.5">
		<h2 id="place-selections-title" class="text-body-lg font-semibold">Your Selections</h2>
		<Button bind:ref={editButton} variant="ghost" class="-my-2 -mr-3 text-body" onclick={onedit}>
			Edit
		</Button>
	</div>

	{#if selector.selected.length === 0}
		<p class="max-w-[32ch] px-5 py-1 text-body text-muted-foreground">
			No places selected yet. Choose Edit to add a state, county, or city.
		</p>
	{:else}
		<ul
			bind:this={list}
			class="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto px-5 pt-0.5 pb-5"
			aria-labelledby="place-selections-title"
			onpointerleave={() => onhover?.(null)}
		>
			{#each selector.selected as place (place.id)}
				{@const style = LEVEL_STYLE[place.level]}
				<li
					class="flex max-w-full items-center gap-2.5 rounded-xl border border-border bg-card py-1 pr-3.5 pl-1"
					onpointerenter={() => onhover?.(place.id)}
				>
					<button
						type="button"
						data-remove={place.id}
						class={cn(
							'group grid size-8 flex-none place-items-center rounded-lg transition-colors hover:text-card focus-visible:text-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
							style.square,
							style.removeButton
						)}
						aria-label="Remove {place.name}"
						onclick={(event) => remove(place, event)}
						onfocus={() => onhover?.(place.id)}
					>
						<style.icon
							class="size-[18px] group-hover:hidden group-focus-visible:hidden"
							aria-hidden="true"
						/>
						<X
							class="hidden size-[18px] group-hover:block group-focus-visible:block"
							aria-hidden="true"
						/>
					</button>
					<span class="flex min-w-0 flex-col">
						<span class="truncate text-body font-semibold">{place.name}</span>
						<span class="truncate text-caption text-muted-foreground">{place.context}</span>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
