<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PollStatusControl from './PollStatusControl.svelte';

	const { Story } = defineMeta({
		title: 'Conversation/PollStatusControl',
		component: PollStatusControl,
		tags: ['autodocs'],
		args: {
			status: 'live',
			onGoLive: async () => {},
			slug: 'ai-utah'
		}
	});
</script>

<Story name="Live" />

<Story name="Draft" args={{ status: 'draft' }} />

<Story name="Paused" args={{ status: 'paused' }} />

<Story name="Done" args={{ status: 'complete' }} />

<!-- A rejected write leaves the badge on its old state and says so inline. -->
<Story
	name="Go live fails"
	args={{
		status: 'draft',
		onGoLive: async () => {
			throw new Error('nope');
		}
	}}
/>
