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
			This conversation is about how Utah can prepare for the growing impact of AI in so many aspects of our lives (work and the economy, education, wellbeing, information quality, government services, etc).
		</p>
		<p class="mt-4 font-sans text-lg font-medium leading-7">
			It is hosted by the <strong>Mormon Women for Ethical Governance</strong>, with the support of many other nonpartisan organizations across Utah. You can find out more about them at
			<a href="https://utahcommonground.org" target="_blank" rel="noopener noreferrer" class="text-primary underline">utahcommonground.org</a>.
		</p>
	</div>
</InfoOverlay>
