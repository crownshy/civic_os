<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BrandPreview from './BrandPreview.svelte';
	import { BRAND_PRESETS, EMPTY_BRAND } from '@civicos/shared/data/brand';

	const CATEGORIES = [
		{ name: 'Age', answer: '25-34' },
		{ name: 'Race / Ethnicity', answer: 'Black / African American' },
		{ name: 'Gender', answer: 'Male' },
		{ name: 'Political Affiliation', answer: 'Progressive' }
	];

	const { Story } = defineMeta({
		title: 'Setup/BrandPreview',
		component: BrandPreview,
		tags: ['autodocs'],
		args: {
			brand: EMPTY_BRAND,
			campaignTitle: 'What should Dundee build next?',
			keyQuestion: 'What should Dundee build next?',
			placeName: 'Dundee',
			hostName: 'Futures Council',
			categories: CATEGORIES
		}
	});

	const byId = (id: string) => ({
		tokens: BRAND_PRESETS.find((p) => p.id === id)?.tokens ?? {},
		css: null
	});
</script>

<!-- Unbranded: the deployment defaults, which is what every Campaign starts on. -->
<Story name="Deployment default" />

<!-- The blue swatch. A preset writes six tokens, and this is the honest picture
     of how far six reach: the page tint, the voting column and the buttons move,
     the body copy stays BLOOM brown. -->
<Story name="Blue preset" args={{ brand: byId('blue') }} />

<!-- A Brand that sets every surface, so nothing brown survives. -->
<Story
	name="Fully branded"
	args={{
		brand: {
			tokens: {
				background: '#0f1720',
				foreground: '#e8eef5',
				card: '#1b2733',
				cardForeground: '#e8eef5',
				muted: '#16212c',
				mutedForeground: '#cfdae6',
				border: '#2b3a49',
				primary: '#4da3ff',
				primaryForeground: '#06121f',
				secondary: '#8fb4d9',
				secondaryForeground: '#06121f',
				accent: '#1b2733',
				radius: '1rem'
			},
			css: null
		}
	}}
/>

<!-- A Campaign over a Host: the preview resolves both layers in civicos's order. -->
<Story
	name="Campaign over Host"
	args={{
		brand: { tokens: { primary: '#8c2f39' }, css: null },
		inherited: { tokens: { background: '#f4f1ea', primary: '#1f4b6e' }, css: null }
	}}
/>
