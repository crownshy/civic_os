<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';

	interface Props {
		open: boolean;
		/** The Place the areas belong to, for the title. Empty when none is typed yet. */
		placeName: string;
		/**
		 * The picker. Dialog content only mounts while open, so it reads the current
		 * selection fresh on every open.
		 */
		children: Snippet;
	}

	let { open = $bindable(), placeName, children }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90vh] w-[min(94vw,1200px)] flex-col overflow-hidden font-ui sm:max-w-[1200px]"
	>
		<Dialog.Header class="shrink-0">
			<Dialog.Title class="font-display text-h4 font-semibold md:text-h3">
				{placeName.trim() ? `Areas in ${placeName.trim()}` : 'Areas'}
			</Dialog.Title>
			<Dialog.Description class="text-body text-muted-foreground">
				The states, counties and cities this Place covers. Picking a state or county does not pick
				the places inside it.
			</Dialog.Description>
		</Dialog.Header>

		<div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
			{@render children()}
		</div>

		<Dialog.Footer class="shrink-0 border-t border-border pt-4">
			<Button onclick={() => (open = false)}>Done</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
