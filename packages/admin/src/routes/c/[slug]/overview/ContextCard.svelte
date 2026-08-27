<script lang="ts">
	import type { Snippet } from 'svelte';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';
	import SetupField from '$lib/components/setup/SetupField.svelte';
	import { RICH_TEXT_PROSE_CLASS, toRichTextHtml } from '$lib/utils/rich-text';

	interface Props {
		/**
		 * Basic description shown on the campaign homepage
		 * (Conversation.description). Now rich text as HTML; legacy rows are still
		 * plain text, and `toRichTextHtml` covers both.
		 */
		description: string;
		/** When provided, replaces the read-only description with an editable field. */
		descriptionField?: Snippet;
	}

	let { description, descriptionField }: Props = $props();
</script>

<SetupCard
	title="Context for Participants"
	subtitle="This will appear on the homepage for this conversation."
>
	<SetupField label="Basic Description">
		{#if descriptionField}
			{@render descriptionField()}
		{:else}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class={RICH_TEXT_PROSE_CLASS}>{@html toRichTextHtml(description)}</div>
		{/if}
	</SetupField>

	<!-- FAQ is intentionally omitted for now per #352 (still deciding how/where
	     FAQs are used). Add the FAQ section here when that's settled. -->
</SetupCard>
