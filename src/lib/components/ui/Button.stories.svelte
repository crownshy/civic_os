<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		title: 'Primitives/Button',
		component: Button,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['primary', 'secondary', 'destructive', 'pill', 'ghost', 'gradient', 'outline']
			},
			size: { control: 'select', options: ['sm', 'md', 'lg'] },
			fullWidth: { control: 'boolean' },
			disabled: { control: 'boolean' }
		}
	});
</script>

<Story name="All Variants" args={{}}>
	{#snippet children(args)}
		<div class="flex flex-col gap-4 bg-primary p-8 rounded-xl">
			<Button variant="primary">PRIMARY</Button>
			<Button variant="secondary">SECONDARY</Button>
			<Button variant="destructive" size="sm">DESTRUCTIVE</Button>
			<Button variant="pill" size="sm">PILL</Button>
			<Button variant="ghost">GHOST</Button>
			<Button variant="gradient">GRADIENT</Button>
			<Button variant="outline">OUTLINE</Button>
		</div>
	{/snippet}
</Story>
