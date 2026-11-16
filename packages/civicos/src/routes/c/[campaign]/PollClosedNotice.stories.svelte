<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PollClosedNotice from './PollClosedNotice.svelte';

	const { Story } = defineMeta({
		title: 'Landing/PollClosedNotice',
		component: PollClosedNotice,
		tags: ['autodocs'],
		args: { status: 'paused', reportHref: '#' }
	});
</script>

<Story name="Paused" />

<Story name="Done" args={{ status: 'complete' }} />
