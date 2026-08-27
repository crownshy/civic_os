<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CheckpointsCard from '$lib/components/setup/CheckpointsCard.svelte';
	import { DEFAULT_CHECKPOINT_TOGGLES } from '$lib/config/checkpoints';

	const { Story } = defineMeta({
		title: 'Setup/CheckpointsCard',
		component: CheckpointsCard,
		tags: ['autodocs'],
		args: {
			title: 'Checkpoint Prompts',
			subtitle:
				"Participants are shown one of these between rounds of voting. Turn off any you don't want to ask for.",
			toggles: DEFAULT_CHECKPOINT_TOGGLES,
			onToggle: async () => {}
		}
	});
</script>

<Story name="All on" />

<Story
	name="Some off"
	args={{ toggles: { contribute: true, email: false, feedback: false, share: true } }}
/>

<!-- No onToggle: the switches render but cannot be operated. -->
<Story name="Read only" args={{ onToggle: undefined }} />
