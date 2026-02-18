<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import QuoteText from './QuoteText.svelte';

	const { Story } = defineMeta({
		title: 'UI/QuoteText',
		component: QuoteText,
		tags: ['autodocs'],
		argTypes: {
			size: { control: 'select', options: ['md', 'lg', 'xl'] },
			variant: { control: 'select', options: ['primary', 'white'] }
		}
	});
</script>

<Story name="Large Primary" args={{ size: 'lg', variant: 'primary' }}>
	{#snippet children(args)}
		<QuoteText {...args}>"THIS IS MY OPINION ON THE TOPIC."</QuoteText>
	{/snippet}
</Story>

<Story name="XL White" args={{ size: 'xl', variant: 'white' }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<QuoteText {...args}>WELCOME!</QuoteText>
		</div>
	{/snippet}
</Story>

<Story name="Medium" args={{ size: 'md', variant: 'primary' }}>
	{#snippet children(args)}
		<QuoteText {...args}>WHAT DO YOU THINK?</QuoteText>
	{/snippet}
</Story>
