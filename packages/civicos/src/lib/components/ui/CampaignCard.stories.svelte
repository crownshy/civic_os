<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CampaignCard from './CampaignCard.svelte';

	const { Story } = defineMeta({
		title: 'Directory/CampaignCard',
		component: CampaignCard,
		tags: ['autodocs'],
		parameters: {
			layout: 'padded'
		}
	});

	const campaign = {
		id: 'c1',
		title: 'AI and our communities',
		description: 'What should artificial intelligence be allowed to do where you live?',
		place: { slug: 'dundee', name: 'Dundee, Scotland' },
		href: '/ai-dundee',
		status: 'live' as const
	};
</script>

<Story name="Default" args={{ campaign }} />

<Story
	name="No Place"
	args={{
		campaign: { ...campaign, place: null, href: '/ai' }
	}}
/>

<Story name="No description" args={{ campaign: { ...campaign, description: '' } }} />

<Story name="Paused" args={{ campaign: { ...campaign, status: 'paused' as const } }} />

<Story name="Done" args={{ campaign: { ...campaign, status: 'complete' as const } }} />
