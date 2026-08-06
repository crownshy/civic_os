<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CoHostsCard from './CoHostsCard.svelte';

	const { Story } = defineMeta({
		title: 'Setup/CoHostsCard',
		component: CoHostsCard,
		tags: ['autodocs']
	});
</script>

<!-- What the static region config gives us today: names + websites, no emails. -->
<Story
	name="From static region (no emails)"
	args={{
		cohosts: [
			{ name: 'Central Oregon Civic Action Project', website: 'https://cocap.us', isAdmin: true },
			{ name: 'Citizens 4 Community', website: 'https://citizens4community.com' }
		]
	}}
/>

<!-- What the full Host model (#362) will populate. -->
<Story
	name="Full data"
	args={{
		cohosts: [
			{
				name: 'Central Oregon Civic Action Project',
				website: 'https://cocap.us',
				email: 'info@cocap.us',
				isAdmin: true
			},
			{
				name: 'Citizens 4 Community',
				website: 'https://citizens4community.com',
				email: 'hello@citizens4community.com'
			}
		]
	}}
/>

<Story name="Single host" args={{ cohosts: [{ name: 'The Bloom Project', isAdmin: true }] }} />
