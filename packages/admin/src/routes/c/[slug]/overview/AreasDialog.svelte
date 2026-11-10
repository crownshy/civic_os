<script lang="ts">
	import type { CampaignArea } from '@civicos/shared/data/areas';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import AreasPicker from './AreasPicker.svelte';

	interface Props {
		open: boolean;
		/** The Place the areas belong to, for the title. Empty when none is typed yet. */
		placeName: string;
		areas: CampaignArea[];
		/** Persist the whole selection. Called after every pick or removal. */
		onSave: (areas: CampaignArea[]) => Promise<void>;
	}

	let { open = $bindable(), placeName, areas, onSave }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90vh] w-[min(94vw,1200px)] flex-col overflow-hidden font-ui sm:max-w-[1200px]"
	>
		<Dialog.Header class="shrink-0">
			<Dialog.Title class="font-display text-h4 font-semibold md:text-h3">
				{placeName ? `Areas in ${placeName}` : 'Areas'}
			</Dialog.Title>
			<Dialog.Description class="text-body text-muted-foreground">
				The states, counties and cities this Place covers. Picking a state or county does not pick
				the places inside it.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Dialog content only mounts while open, so the picker reads the saved
		     areas fresh on every open. -->
		<div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
			<AreasPicker {areas} {onSave} />
		</div>

		<Dialog.Footer class="shrink-0 border-t border-border pt-4">
			<Button onclick={() => (open = false)}>Done</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
