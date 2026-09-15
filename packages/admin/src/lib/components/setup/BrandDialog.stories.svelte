<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BrandDialog from './BrandDialog.svelte';
	import { EMPTY_BRAND } from '@civicos/shared/data/brand';

	const CATEGORIES = [
		{ name: 'Age', answer: '25-34' },
		{ name: 'Race / Ethnicity', answer: 'Black / African American' },
		{ name: 'Gender', answer: 'Male' },
		{ name: 'Political Affiliation', answer: 'Progressive' }
	];

	const { Story } = defineMeta({
		title: 'Setup/BrandDialog',
		component: BrandDialog,
		tags: ['autodocs'],
		args: {
			open: true,
			brand: EMPTY_BRAND,
			campaignTitle: 'What should Dundee build next?',
			keyQuestion: 'What should Dundee build next?',
			placeName: 'Dundee',
			hostName: 'Futures Council',
			categories: CATEGORIES,
			onSave: async () => {}
		}
	});
</script>

<!-- Nothing set at any layer: every field shows "Deployment default" and the
     phone shows BLOOM's own palette. -->
<Story name="Default" />

<!-- The Host has a Brand and the Campaign has not overridden it. Each empty
     field reports what it inherits, and the preview renders the Host layer,
     which is what a participant would actually see. -->
<Story
	name="Inheriting from the Host"
	args={{
		inherited: {
			tokens: { background: '#f4f1ea', primary: '#1f4b6e', radius: '0.75rem' },
			css: null
		}
	}}
/>

<!-- A Campaign overriding its Host on one token. -->
<Story
	name="Campaign override"
	args={{
		brand: { tokens: { primary: '#8c2f39', accent: '#f0dfe1' }, css: '--shell-border: #6b7c8c' },
		inherited: { tokens: { background: '#f4f1ea', primary: '#1f4b6e' }, css: null }
	}}
/>

<!-- Every demographic switched off. The About You screen has no rows, which is
     what participants get. -->
<Story name="No demographics" args={{ categories: [] }} />

<!-- No `onSave`: the fields render disabled and the footer is gone, so the
     dialog is a preview of a Brand someone else owns. -->
<Story name="Read-only" args={{ onSave: undefined }} />
