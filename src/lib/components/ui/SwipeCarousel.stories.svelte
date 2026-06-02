<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SwipeCarousel from './SwipeCarousel.svelte';

	const { Story } = defineMeta({
		title: 'Composites/SwipeCarousel',
		component: SwipeCarousel,
		tags: ['autodocs'],
		argTypes: {
			count: { control: { type: 'range', min: 1, max: 6 } },
			autoScrollMs: { control: 'number' }
		}
	});

	const slides = [
		{
			title: 'Platform Accountability',
			body: 'Hold companies responsible for the content on their platforms.'
		},
		{
			title: 'Digital Literacy',
			body: 'Teach people how to critically evaluate online information.'
		},
		{ title: 'Parental Controls', body: 'Give parents better tools without invading teen privacy.' }
	];
</script>

<Story name="Default" args={{ count: 3 }}>
	{#snippet children(args)}
		<div class="rounded-xl bg-primary p-8">
			<SwipeCarousel count={slides.length}>
				{#snippet children(index)}
					<div class="rounded-[20px] bg-white p-6">
						<h3 class="font-sans text-2xl font-bold text-secondary">{slides[index].title}</h3>
						<p class="mt-3 font-sans text-lg text-secondary/80">{slides[index].body}</p>
					</div>
				{/snippet}
			</SwipeCarousel>
		</div>
	{/snippet}
</Story>

<Story name="Auto Scroll" args={{ count: 3, autoScrollMs: 3000 }}>
	{#snippet children(args)}
		<div class="rounded-xl bg-primary p-8">
			<SwipeCarousel count={slides.length} autoScrollMs={3000}>
				{#snippet children(index)}
					<div class="rounded-[20px] bg-white p-6">
						<h3 class="font-sans text-2xl font-bold text-secondary">{slides[index].title}</h3>
						<p class="mt-3 font-sans text-lg text-secondary/80">{slides[index].body}</p>
					</div>
				{/snippet}
			</SwipeCarousel>
		</div>
	{/snippet}
</Story>
