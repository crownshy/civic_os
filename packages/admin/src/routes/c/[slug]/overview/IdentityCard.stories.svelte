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
			places: ['Oregon']
		}
	});
</script>

<Story name="Default" />

<Story
	name="Multiple places"
	args={{ places: ['Prineville', 'Deschutes County', 'Jefferson County'] }}
/>

<!-- A Campaign nobody has given a Place yet still shows the slot rather than
     collapsing the row. civicos 404s this one (ADR 0007). -->
<Story name="No places" args={{ places: [] }} />

<!--
	The state the app actually ships: Setup passes a snippet per editable field.
	The inputs here mirror the ones in `+page.svelte`; they are unwired, so this
	story is about layout and sizing, not about saving.
-->
<Story name="Editable">
	{#snippet template(args)}
		<IdentityCard {...args} {titleField} {slugField} {keyQuestionField} {placeField} />
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

<!--
	The Place field on its own, with the derived subdomain under it. The Host
	types a name and the slug follows from it, so this line is the only place the
	consequence of a rename is visible before it happens.
-->
{#snippet placeField()}
	<div class="flex min-h-9 flex-col gap-1.5">
		<input
			value="Dundee, Scotland"
			aria-label="Place"
			placeholder="e.g. Dundee, Scotland"
			class="field-sizing-content min-w-40 rounded-[10px] border border-stone-300 bg-muted px-3 py-1.5 text-body font-semibold focus:border-primary focus:outline-none"
		/>
		<p class="text-caption text-muted-foreground">Served from dundee-scotland.bloomproject.us</p>
	</div>
{/snippet}

{#snippet keyQuestionField()}
	<textarea
		rows="2"
		class="field-sizing-content w-full resize-none rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
		>How should Central Oregon manage the changes that are coming with AI?</textarea
	>
{/snippet}
