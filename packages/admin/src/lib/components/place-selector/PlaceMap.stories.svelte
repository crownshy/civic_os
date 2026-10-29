<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PlaceMapStory from './PlaceMapStory.svelte';

	const { Story } = defineMeta({
		title: 'Place selector/PlaceMap',
		component: PlaceMapStory,
		tags: ['autodocs']
	});

	const MIXED_SELECTION = ['state-49', 'county-41031', 'county-41017', 'city-4105800'];
</script>

<Story name="Mixed selection" args={{ selectedIds: MIXED_SELECTION }} />

<Story
	name="Drilled into a county"
	args={{
		selectedIds: ['city-4145250'],
		setup: async (selector) => {
			selector.openEdit();
			await selector.drill('state-41');
			await selector.drill('county-41031');
		}
	}}
/>

<Story
	name="Search"
	args={{
		selectedIds: MIXED_SELECTION,
		setup: async (selector) => {
			selector.openEdit();
			await selector.setQuery('sa');
		}
	}}
/>

<Story name="Reframing" args={{ selectedIds: MIXED_SELECTION, controls: true }} />
