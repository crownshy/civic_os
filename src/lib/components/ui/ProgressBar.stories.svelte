<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProgressBar from './ProgressBar.svelte';

	const { Story } = defineMeta({
		title: 'UI/ProgressBar',
		component: ProgressBar,
		tags: ['autodocs'],
		argTypes: {
			percentage: { control: { type: 'range', min: 0, max: 100 } },
			variant: { control: 'select', options: ['on-white', 'on-primary'] },
			label: { control: 'text' }
		}
	});
</script>

<Story name="On White" args={{ percentage: 75, variant: 'on-white' }}>
	{#snippet children(args)}
		<ProgressBar {...args} />
	{/snippet}
</Story>

<Story name="With Label" args={{ percentage: 60, variant: 'on-white', label: 'Platform Accountability' }}>
	{#snippet children(args)}
		<ProgressBar {...args} />
	{/snippet}
</Story>

<Story name="On Primary" args={{ percentage: 85, variant: 'on-primary' }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<ProgressBar {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Multiple Bars" args={{}}>
	{#snippet children(args)}
		<div class="flex flex-col gap-4">
			<ProgressBar percentage={100} variant="on-white" />
			<ProgressBar percentage={82} variant="on-white" />
			<ProgressBar percentage={48} variant="on-white" />
			<ProgressBar percentage={30} variant="on-white" />
			<ProgressBar percentage={12} variant="on-white" />
		</div>
	{/snippet}
</Story>
