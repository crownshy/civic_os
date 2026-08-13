<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Search, X, Check } from '@lucide/svelte';

	type PickerOrg = { id: string; name: string; website?: string | null; email?: string | null };

	interface Props {
		open: boolean;
		convId: string;
		pickerOrgs: PickerOrg[];
		/** Orgs already attached (owning host + existing co-hosts) — not selectable. */
		excludeIds: string[];
	}

	let { open = $bindable(), convId, pickerOrgs, excludeIds }: Props = $props();

	let query = $state('');
	let selected = $state<string[]>([]);
	let submitting = $state(false);

	const byId = $derived(new Map(pickerOrgs.map((o) => [o.id, o])));
	const excluded = $derived(new Set(excludeIds));

	// Available = not already attached. Filtered by the search box.
	const results = $derived(
		pickerOrgs
			.filter((o) => !excluded.has(o.id))
			.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
	);

	const selectedOrgs = $derived(selected.map((id) => byId.get(id)).filter((o): o is PickerOrg => !!o));

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
	}

	const stripProtocol = (url?: string | null) =>
		url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';

	// Reset transient state each time the dialog opens (event, not an effect).
	function onOpenChange(next: boolean) {
		if (next) {
			query = '';
			selected = [];
		}
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content class="font-ui max-h-[85vh] w-[min(92vw,1000px)] overflow-y-auto sm:max-w-[1000px]">
		<Dialog.Header>
			<Dialog.Title class="text-section font-bold">Add New Co-Hosts</Dialog.Title>
			<Dialog.Description class="text-body text-muted-foreground">
				Search for existing Hosts on BLOOM in your campaign's location.
			</Dialog.Description>
		</Dialog.Header>

		<!-- SELECTED -->
		<div class="mt-2">
			<div
				class="text-muted-foreground text-caption grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-2 pb-1 font-semibold uppercase"
			>
				<div>Selected ({selected.length})</div>
				<div>Website</div>
				<div>Contact Email</div>
			</div>
			{#if selectedOrgs.length === 0}
				<p class="text-muted-foreground px-2 py-3 text-body">No hosts selected yet.</p>
			{:else}
				<div class="divide-border divide-y">
					{#each selectedOrgs as o (o.id)}
						<div
							class="text-body grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 px-2 py-3"
						>
							<button
								type="button"
								onclick={() => toggle(o.id)}
								class="text-primary flex min-w-0 items-center gap-2 text-left font-bold hover:underline"
							>
								<X class="size-4 shrink-0" />
								<span class="truncate">{o.name}</span>
							</button>
							<span class="min-w-0 truncate">{stripProtocol(o.website) || 'Not listed'}</span>
							<span class="min-w-0 truncate">{o.email || 'Not listed'}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Search -->
		<div class="mt-4 flex items-center gap-3">
			<span class="text-muted-foreground text-caption font-semibold uppercase">All hosts</span>
			<div
				class="focus-within:border-primary flex flex-1 items-center gap-2 rounded-[10px] border border-stone-300 px-3"
			>
				<Search class="text-muted-foreground size-4 shrink-0" />
				<input
					bind:value={query}
					placeholder="Search hosts…"
					class="flex-1 bg-transparent py-2.5 text-body focus:outline-none"
				/>
			</div>
		</div>

		<!-- Results -->
		<div class="mt-2 min-h-24">
			{#if results.length === 0}
				<p class="text-muted-foreground px-2 py-4 text-body">
					No matching hosts. {query ? 'Try a different search.' : ''}
				</p>
			{:else}
				<div class="divide-border divide-y">
					{#each results as o (o.id)}
						{@const isSel = selected.includes(o.id)}
						<button
							type="button"
							onclick={() => toggle(o.id)}
							class="text-body hover:bg-muted/40 grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 px-2 py-3 text-left"
						>
							<span class="flex min-w-0 items-center gap-2 font-bold">
								<span
									class={[
										'flex size-4 shrink-0 items-center justify-center rounded-full border',
										isSel ? 'border-primary bg-primary text-white' : 'border-stone-400'
									].join(' ')}
								>
									{#if isSel}<Check class="size-3" />{/if}
								</span>
								<span class="truncate">{o.name}</span>
							</span>
							<span class="min-w-0 truncate">{stripProtocol(o.website) || 'Not listed'}</span>
							<span class="min-w-0 truncate">{o.email || 'Not listed'}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-4">
			<form
				method="POST"
				action="?/grantCohosts"
				use:enhance={() => {
					submitting = true;
					return async ({ update, result }) => {
						await update();
						submitting = false;
						if (result.type === 'success') open = false;
					};
				}}
			>
				<input type="hidden" name="convId" value={convId} />
				{#each selected as id (id)}
					<input type="hidden" name="orgIds" value={id} />
				{/each}
				<Button type="submit" disabled={selected.length === 0 || submitting}>
					{submitting ? 'Adding…' : `Add ${selected.length || ''} co-host${selected.length === 1 ? '' : 's'}`}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
