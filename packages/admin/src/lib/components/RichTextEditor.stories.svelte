<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RichTextEditor from './RichTextEditor.svelte';

	const { Story } = defineMeta({
		title: 'Components/RichTextEditor',
		component: RichTextEditor,
		tags: ['autodocs']
	});
</script>

<script lang="ts">
	let html = $state(
		'<p>Central Oregon is changing fast, and AI is part of that change.</p><p>This conversation is a chance to share how you think our communities should respond.</p>'
	);
	// Legacy Conversation.description rows are still plain text; the editor is
	// expected to give them paragraph structure rather than one long line.
	let legacy = $state('First paragraph.\n\nSecond paragraph,\nwith a soft break.');
	let empty = $state('');
</script>

<Story name="Default">
	{#snippet template()}
		<RichTextEditor value={html} onChange={(next) => (html = next)} />
		<pre class="mt-4 overflow-x-auto text-caption text-muted-foreground">{html}</pre>
	{/snippet}
</Story>

<Story name="Empty">
	{#snippet template()}
		<RichTextEditor value={empty} onChange={(next) => (empty = next)} />
	{/snippet}
</Story>

<Story name="Legacy plain text">
	{#snippet template()}
		<RichTextEditor value={legacy} onChange={(next) => (legacy = next)} />
		<pre class="mt-4 overflow-x-auto text-caption text-muted-foreground">{legacy}</pre>
	{/snippet}
</Story>
