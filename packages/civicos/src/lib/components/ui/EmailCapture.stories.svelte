<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import EmailCapture from './EmailCapture.svelte';

	const { Story } = defineMeta({
		title: 'Composites/EmailCapture',
		component: EmailCapture,
		tags: ['autodocs']
	});
</script>

<Story name="Default" args={{}}>
	{#snippet children(args)}
		<div class="mx-auto max-w-md p-8">
			<EmailCapture
				onSubmit={(email) => console.log('Submit:', email)}
				onSkip={() => console.log('Skip')}
			/>
		</div>
	{/snippet}
</Story>

<Story name="On Dark Background" args={{}}>
	{#snippet children(args)}
		<div class="flex min-h-[600px] items-center justify-center bg-secondary/95 p-8">
			<div class="mx-auto max-w-md">
				<EmailCapture
					onSubmit={(email) => console.log('Submit:', email)}
					onSkip={() => console.log('Skip')}
				/>
			</div>
		</div>
	{/snippet}
</Story>
