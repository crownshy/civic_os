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
		<div class="relative flex h-[400px] w-full items-center justify-center rounded-xl bg-secondary">
			<ConfettiOverlay {...args} />
			<span class="z-10 font-sans text-2xl font-bold text-white">Celebration!</span>
		</div>
	{/snippet}
</Story>

<Story name="Dense" args={{ active: true, count: 50 }}>
	{#snippet children(args)}
		<div class="relative flex h-[400px] w-full items-center justify-center rounded-xl bg-secondary">
			<ConfettiOverlay {...args} />
			<span class="z-10 font-sans text-2xl font-bold text-white">Party Mode!</span>
		</div>
	{/snippet}
</Story>

<Story name="Inactive" args={{ active: false }}>
	{#snippet children(args)}
		<div class="relative flex h-[400px] w-full items-center justify-center rounded-xl bg-secondary">
			<ConfettiOverlay {...args} />
			<span class="z-10 font-sans text-lg text-white/60"
				>Toggle "active" in controls to trigger</span
			>
		</div>
	{/snippet}
</Story>
