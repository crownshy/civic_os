<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import VotingSkeleton from './VotingSkeleton.svelte';
	import { REGIONS } from '$lib/config/regions';

	const { Story } = defineMeta({
		title: 'Screens/VotingSkeleton',
		component: VotingSkeleton,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen'
		}
	});
</script>

<Story name="Default" args={{ placeName: 'UTAH COUNTY', region: REGIONS.utah }}>
	{#snippet template(args)}
		<div class="h-dvh">
			<VotingSkeleton {...args} />
		</div>
	{/snippet}
</Story>
