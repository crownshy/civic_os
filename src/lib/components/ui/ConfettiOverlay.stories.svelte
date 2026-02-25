<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ConfettiOverlay from './ConfettiOverlay.svelte';

	const { Story } = defineMeta({
		title: 'Composites/ConfettiOverlay',
		component: ConfettiOverlay,
		tags: ['autodocs'],
		argTypes: {
			active: { control: 'boolean' },
			count: { control: { type: 'range', min: 5, max: 50 } }
		}
	});
</script>

<Story name="Active" args={{ active: true, count: 24 }}>
	{#snippet children(args)}
		<div class="relative h-[400px] w-full rounded-xl bg-blue-950 flex items-center justify-center">
			<ConfettiOverlay {...args} />
			<span class="font-sans text-2xl font-bold text-white z-10">Celebration!</span>
		</div>
	{/snippet}
</Story>

<Story name="Dense" args={{ active: true, count: 50 }}>
	{#snippet children(args)}
		<div class="relative h-[400px] w-full rounded-xl bg-blue-950 flex items-center justify-center">
			<ConfettiOverlay {...args} />
			<span class="font-sans text-2xl font-bold text-white z-10">Party Mode!</span>
		</div>
	{/snippet}
</Story>

<Story name="Inactive" args={{ active: false }}>
	{#snippet children(args)}
		<div class="relative h-[400px] w-full rounded-xl bg-blue-950 flex items-center justify-center">
			<ConfettiOverlay {...args} />
			<span class="font-sans text-lg text-white/60 z-10">Toggle "active" in controls to trigger</span>
		</div>
	{/snippet}
</Story>
