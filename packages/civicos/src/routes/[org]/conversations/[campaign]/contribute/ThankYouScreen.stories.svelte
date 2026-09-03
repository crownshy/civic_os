<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThankYouScreen from './ThankYouScreen.svelte';
	import { REGIONS } from '$lib/config/regions';
	import { session } from '$lib/services/session.svelte';
	import { DEFAULT_ASK_TOGGLES } from '$lib/config/participation';

	const { Story } = defineMeta({
		title: 'Screens/ThankYouScreen',
		component: ThankYouScreen,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});

	const whatsNext = '<p>We publish the results in the spring, and the report goes to the city.</p>';

	function setState(email: boolean, share: boolean, review: boolean) {
		return () => {
			session.emailProvided = email;
			session.endCtaShareCompleted = share;
			session.endCtaReviewCompleted = review;
		};
	}
</script>

<Story
	name="Default — Utah, nothing done"
	args={{ countyName: 'UTAH COUNTY', whatsNext, asks: DEFAULT_ASK_TOGGLES }}
	beforeEach={setState(false, false, false)}
>
	{#snippet template(args)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story
	name="Email already provided"
	args={{ countyName: 'UTAH COUNTY', whatsNext, asks: DEFAULT_ASK_TOGGLES }}
	beforeEach={setState(true, false, false)}
>
	{#snippet template(args)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story
	name="All CTAs completed"
	args={{ countyName: 'UTAH COUNTY', whatsNext, asks: DEFAULT_ASK_TOGGLES }}
	beforeEach={setState(true, true, true)}
>
	{#snippet template(args)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story
	name="Share switched off in admin"
	args={{
		countyName: 'UTAH COUNTY',
		whatsNext,
		asks: { ...DEFAULT_ASK_TOGGLES, share: false }
	}}
	beforeEach={setState(false, false, false)}
>
	{#snippet template(args)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story
	name="Every ask switched off"
	args={{
		countyName: 'UTAH COUNTY',
		whatsNext,
		asks: { contribute: false, email: false, feedback: false, share: false }
	}}
	beforeEach={setState(false, false, false)}
>
	{#snippet template(args)}
		<ThankYouScreen {...args} region={REGIONS.utah} />
	{/snippet}
</Story>

<Story
	name="Oregon — nothing done"
	args={{ countyName: 'DESCHUTES COUNTY', whatsNext, asks: DEFAULT_ASK_TOGGLES }}
	beforeEach={setState(false, false, false)}
>
	{#snippet template(args)}
		<ThankYouScreen {...args} region={REGIONS.oregon} />
	{/snippet}
</Story>
