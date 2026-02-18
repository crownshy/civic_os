<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemeChip from './ThemeChip.svelte';

	const { Story } = defineMeta({
		title: 'UI/ThemeChip',
		component: ThemeChip,
		tags: ['autodocs'],
		argTypes: {
			label: { control: 'text' }
		}
	});
</script>

<Story name="Default" args={{ label: 'Platform Accountability' }}>
	{#snippet children(args)}
		<ThemeChip {...args} />
	{/snippet}
</Story>

<Story name="Grid" args={{}}>
	{#snippet children(args)}
		<div class="grid grid-cols-2 gap-3">
			<ThemeChip label="Screen Time" />
			<ThemeChip label="Platform Accountability" />
			<ThemeChip label="Digital Literacy" />
			<ThemeChip label="Parental Controls" />
		</div>
	{/snippet}
</Story>
