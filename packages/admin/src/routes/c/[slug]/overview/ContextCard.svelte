<script lang="ts">
	import SetupCard from './SetupCard.svelte';
	import SetupField from './SetupField.svelte';

	interface Props {
		/** Basic description shown on the campaign homepage (Conversation.description). */
		description: string;
	}

	let { description }: Props = $props();
</script>

<SetupCard
	title="Context for Participants"
	subtitle="This will appear on the homepage for this conversation."
>
	<SetupField label="Basic Description">
		<div class="text-body leading-relaxed whitespace-pre-line">{description}</div>
	</SetupField>

	<!-- FAQ is intentionally omitted for now per #352 (still deciding how/where
	     FAQs are used). Add the FAQ section here when that's settled. -->
</SetupCard>
