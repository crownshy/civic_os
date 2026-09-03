<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Header from './Header.svelte';

	const { Story } = defineMeta({
		title: 'Composites/Header',
		component: Header,
		tags: ['autodocs'],
		argTypes: {
			placeName: { control: 'text' }
		}
	});
</script>

<Story name="Default" args={{ placeName: 'UTAH COUNTY' }}>
	{#snippet template(args)}
		<div class="rounded-xl bg-primary">
			<Header {...args} />
		</div>
	{/snippet}
</Story>
