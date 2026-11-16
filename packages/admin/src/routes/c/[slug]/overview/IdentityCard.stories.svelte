<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IdentityCard from './IdentityCard.svelte';

	const { Story } = defineMeta({
		title: 'Setup/IdentityCard',
		component: IdentityCard,
		tags: ['autodocs'],
		args: {
			title: 'AI & Our Communities',
			baseUrl: 'oregon.bloomproject.us',
			slug: 'ai',
			keyQuestion: 'How should Central Oregon manage the changes that are coming with AI?',
			areas: ['Oregon']
		}
	});
</script>

<Story name="Default" />

<Story
	name="Several areas"
	args={{ areas: ['Prineville', 'Deschutes County', 'Jefferson County'] }}
/>

<!-- A Campaign with no areas yet still shows the slot rather than collapsing
     the row. -->
<Story name="No areas" args={{ areas: [] }} />

<!-- With no `colorSchemeId` (every other story here) nothing is ringed, which is
     the honest rendering of a Campaign nobody has picked a scheme for. -->
<Story name="Color scheme chosen" args={{ colorSchemeId: 'slate' }} />

<!-- Picking a swatch shows the spinner and "Saving" for a second, then "saved".
     The stored id never changes here, so the check falls back to Slate after. -->
<Story
	name="Color scheme editable"
	args={{
		colorSchemeId: 'slate',
		onSelectColorScheme: () => new Promise<void>((resolve) => setTimeout(resolve, 1000))
	}}
/>

<!--
	The state the app actually ships: Setup passes a snippet per editable field.
	The inputs here mirror the ones in `+page.svelte`; they are unwired, so this
	story is about layout and sizing, not about saving.
-->
<Story name="Editable">
	{#snippet template(args)}
		<IdentityCard {...args} {titleField} {slugField} {keyQuestionField} {areasField} />
	{/snippet}
</Story>

{#snippet titleField()}
	<input
		value="AI & Our Communities"
		class="font-display w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body-lg font-semibold focus:border-primary focus:outline-none"
	/>
{/snippet}

{#snippet slugField()}
	<div class="flex items-center gap-1.5 text-body font-semibold">
		<span class="shrink-0">oregon.bloomproject.us/</span>
		<input
			value="ai"
			class="field-sizing-content min-w-24 rounded-[10px] border border-stone-300 bg-muted px-3 py-1.5 focus:border-primary focus:outline-none"
		/>
	</div>
{/snippet}

{#snippet areasField()}
	<div class="flex min-h-9 flex-wrap items-center gap-2">
		<span class="rounded-[10px] bg-primary/5 px-2.5 py-1.5 text-caption font-medium text-primary">
			Deschutes County
		</span>
		<button type="button" class="text-caption text-primary underline-offset-4 hover:underline">
			Edit areas
		</button>
	</div>
{/snippet}

{#snippet keyQuestionField()}
	<textarea
		rows="2"
		class="field-sizing-content w-full resize-none rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
		>How should Central Oregon manage the changes that are coming with AI?</textarea
	>
{/snippet}
