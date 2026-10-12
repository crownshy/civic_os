<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SeedStatementsPreview from './SeedStatementsPreview.svelte';

	const { Story } = defineMeta({
		title: 'Seeds/SeedStatementsPreview',
		component: SeedStatementsPreview,
		tags: ['autodocs'],
		parameters: { layout: 'padded' }
	});

	const drafts = [
		{ id: 1, text: 'Buses should run later on weekends' },
		{ id: 2, text: 'Parks need better lighting' },
		{ id: 3, text: 'buses should run later on weekends' },
		{ id: 4, text: 'The library should open on Sundays' },
		{ id: 5, text: 'x'.repeat(250) },
		{ id: 6, text: '' }
	];

	const oneColumn = {
		statements: [],
		header: 'statement',
		problems: [],
		columns: [],
		column: null
	};

	const multiColumn = {
		...oneColumn,
		header: 'statement_text',
		columns: [
			{ index: 0, heading: 'user_id' },
			{ index: 2, heading: 'statement_text' },
			{ index: 3, heading: 'moderation_status' }
		],
		column: 2
	};
</script>

<!-- Every flag at once: a repeat in the file, one already in the poll, one too long, one empty. -->
<Story
	name="Flagged statements"
	args={{
		drafts,
		parsed: oneColumn,
		existing: ['The library should open on Sundays'],
		posting: false,
		onColumnChange: () => {}
	}}
/>

<Story
	name="Multi-column export"
	args={{
		drafts: drafts.slice(0, 2),
		parsed: multiColumn,
		existing: [],
		posting: false,
		onColumnChange: () => {}
	}}
/>

<!-- An unterminated quote swallowed the rest of the file: named above the list. -->
<Story
	name="Malformed file"
	args={{
		drafts: [{ id: 1, text: 'Buses are late Cycling is fine More routes please' }],
		parsed: { ...oneColumn, header: null, problems: ['Quoted field unterminated (row 1)'] },
		existing: [],
		posting: false,
		onColumnChange: () => {}
	}}
/>
