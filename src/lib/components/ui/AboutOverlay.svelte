<script lang="ts">
	import InfoOverlay from './InfoOverlay.svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();
</script>

<InfoOverlay title="About this Conversation" {onClose} fullscreen>
	<div class="pt-6">
		<p class="font-sans text-lg font-medium leading-7">
			Many Utahns are looking for ways to engage productively with each other, both on and offline, for the purpose of addressing public needs and solving problems.
		</p>
		<p class="mt-4 font-sans text-lg font-medium leading-7">
			Utah Common Ground <a href="https://www.utahcommonground.org/home" class="break-all text-primary underline" target="_blank" rel="noopener noreferrer">https://www.utahcommonground.org</a> formed to help citizens come together across political differences to identify issues of local concern, consider possible solutions, and take the necessary steps to achieve meaningful, measurable change. We're inviting people from across the state and from a wide variety of backgrounds and perspectives to be part of this discussion.
		</p>
	</div>
</InfoOverlay>
