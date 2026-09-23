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
		/**
		 * What participants are told happens after the poll closes
		 * (Conversation.thankYouMessage). Rendered on the Campaign homepage under
		 * What's Next, and again on the Open Poll's end screen.
		 */
		thankYouMessage: string;
		/** When provided, replaces the read-only message with an editable field. */
		thankYouMessageField?: Snippet;
	}

	let { description, descriptionField, thankYouMessage, thankYouMessageField }: Props = $props();
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

	<SetupField label="What Happens Next" class="mt-6">
		{#if thankYouMessageField}
			{@render thankYouMessageField()}
		{:else}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class={RICH_TEXT_PROSE_CLASS}>{@html toRichTextHtml(thankYouMessage)}</div>
		{/if}
	</SetupField>

	<!-- The FAQ #352 deferred is now its own card on Setup (`FaqCard`), because it
	     writes to `Conversation.faqs` rather than to this card's superform. -->
</SetupCard>
