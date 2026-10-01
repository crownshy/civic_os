<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CharCount from './CharCount.svelte';

	const { Story } = defineMeta({
		title: 'Components/CharCount',
		component: CharCount,
		tags: ['autodocs']
	});
</script>

<script lang="ts">
	let title = $state('Water in the Wasatch');
</script>

<Story name="Under the limit" args={{ count: 18, limit: 120 }} />

<Story name="At the limit" args={{ count: 120, limit: 120 }} />

<!-- Only fields without a hard maxlength reach this: rich text and seeds. -->
<Story name="Over the limit" args={{ count: 5120, limit: 5000 }} />

<Story name="Under an input">
	{#snippet template()}
		<div class="max-w-md">
			<input
				bind:value={title}
				maxlength={120}
				aria-label="Title"
				class="w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body-lg font-semibold focus:border-primary focus:outline-none"
			/>
			<CharCount count={title.length} limit={120} class="mt-1" />
		</div>
	{/snippet}
</Story>
