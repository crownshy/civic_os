<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ContributionRow from './ContributionRow.svelte';

	const { Story } = defineMeta({
		title: 'UI/ContributionRow',
		component: ContributionRow,
		tags: ['autodocs'],
		argTypes: {
			text: { control: 'text' },
			meta: { control: 'text' }
		}
	});
</script>

<Story name="With Delete" args={{ text: '"Social media companies should be held responsible whenever someone is harmed on their platform."', meta: 'DELIBERATION 01' }}>
	{#snippet children(args)}
		<ContributionRow {...args} onDelete={() => {}} />
	{/snippet}
</Story>

<Story name="Without Delete" args={{ text: '"We need mandatory digital literacy classes in every school."', meta: 'POSTED JAN 02 2026' }}>
	{#snippet children(args)}
		<ContributionRow {...args} />
	{/snippet}
</Story>

<Story name="Multiple" args={{}}>
	{#snippet children(args)}
		<div class="flex flex-col">
			<ContributionRow
				text='"Social media companies should be held responsible."'
				meta="DELIBERATION 01"
				onDelete={() => {}}
			/>
			<ContributionRow
				text='"We need digital literacy classes in every school."'
				meta="DELIBERATION 02"
				onDelete={() => {}}
			/>
		</div>
	{/snippet}
</Story>
