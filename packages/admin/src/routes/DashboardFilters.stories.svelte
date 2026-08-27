<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DashboardFilters from './DashboardFilters.svelte';

	const { Story } = defineMeta({
		title: 'Dashboard/DashboardFilters',
		component: DashboardFilters,
		tags: ['autodocs'],
		args: {
			search: '',
			status: 'all',
			alphabetical: false,
			counts: { all: 14, live: 7, draft: 5, complete: 2 }
		}
	});
</script>

<Story name="Default" />

<!-- A live query: the clear button replaces the trailing padding. -->
<Story name="Searching" args={{ search: 'local dev' }} />

<Story name="Filtered and sorted" args={{ status: 'draft', alphabetical: true }} />

<!-- Counts go to zero when the account has nothing of that status. -->
<Story name="Empty account" args={{ counts: { all: 0, live: 0, draft: 0, complete: 0 } }} />
