<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FloatingStatement from './FloatingStatement.svelte';

	const { Story } = defineMeta({
		title: 'UI/FloatingStatement',
		component: FloatingStatement,
		tags: ['autodocs'],
		argTypes: {
			text: { control: 'text' }
		}
	});
</script>

<Story name="Default" args={{ text: '"I THINK XYZ IS IMPORTANT FOR THE FUTURE' }}>
	{#snippet children(args)}
		<FloatingStatement {...args} />
	{/snippet}
</Story>

<Story name="On Primary" args={{ text: '"WE SHOULD CONSIDER DOING ABC WHEN DOING' }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<FloatingStatement {...args} />
		</div>
	{/snippet}
</Story>
