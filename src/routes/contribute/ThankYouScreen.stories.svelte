<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThankYouScreen from './ThankYouScreen.svelte';
	import { REGIONS } from '$lib/config/regions';
	import { session } from '$lib/services/session.svelte';

	const { Story } = defineMeta({
		title: 'Screens/ThankYouScreen',
		component: ThankYouScreen,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});

	function setState(email: boolean, share: boolean, review: boolean): '' {
		session.emailProvided = email;
		session.endCtaShareCompleted = share;
		session.endCtaReviewCompleted = review;
		return '';
	}
</script>

<Story name="Default — Utah, nothing done" args={{ countyName: 'UTAH COUNTY' }}>
	{#snippet children(args)}
		{setState(false, false, false)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story name="Email already provided" args={{ countyName: 'UTAH COUNTY' }}>
	{#snippet children(args)}
		{setState(true, false, false)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story name="All CTAs completed" args={{ countyName: 'UTAH COUNTY' }}>
	{#snippet children(args)}
		{setState(true, true, true)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story name="Oregon — nothing done" args={{ countyName: 'DESCHUTES COUNTY' }}>
	{#snippet children(args)}
		{setState(false, false, false)}
		<ThankYouScreen {...args} region={REGIONS.oregon} />
	{/snippet}
</Story>
