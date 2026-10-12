<script lang="ts">
	import Dialog from './Dialog.svelte';
	import { HOST_COPY_PROSE_CLASS, renderHostCopy, type HostCopy } from '$lib/config/host-copy';

	interface Props {
		open: boolean;
		/** Optional because a screen rendered outside a Campaign (Storybook) has none. */
		hostCopy?: HostCopy;
	}

	let { open = $bindable(false), hostCopy }: Props = $props();

	const context = $derived(hostCopy?.context ?? '');
	const whatsNext = $derived(hostCopy?.whatsNext ?? '');
</script>

<!-- The two fields of admin's "Context for Participants" card: Basic Description
	and What Happens Next. ABOUT always opens this, so it says so plainly rather
	than opening blank when the Host has written neither. -->
<Dialog bind:open title="About This Conversation" buttonText="GOT IT">
	<div class="flex flex-col gap-7 px-7 pt-6 {HOST_COPY_PROSE_CLASS}">
		{#if context}
			<div>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- `renderHostCopy` sanitizes (#409) -->
				{@html renderHostCopy(context)}
			</div>
		{/if}
		{#if whatsNext}
			<div>
				<h3>What's Next?</h3>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- `renderHostCopy` sanitizes (#409) -->
				{@html renderHostCopy(whatsNext)}
			</div>
		{/if}
		{#if !context && !whatsNext}
			<p class="text-muted-foreground">
				The host hasn't added details about this conversation yet.
			</p>
		{/if}
	</div>
</Dialog>
