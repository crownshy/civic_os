<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LiveToggle from './LiveToggle.svelte';

	const { Story } = defineMeta({
		title: 'Conversation/LiveToggle',
		component: LiveToggle,
		tags: ['autodocs'],
		args: {
			isLive: true,
			onToggle: async () => {}
		}
	});
</script>

<Story name="Live" />

<Story name="Draft" args={{ isLive: false }} />

<!-- A rejected write leaves the badge on its old state and says so inline. -->
<Story
	name="Write fails"
	args={{
		isLive: false,
		onToggle: async () => {
			throw new Error('nope');
		}
	}}
/>
