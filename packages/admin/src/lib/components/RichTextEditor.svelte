<script lang="ts">
	import { untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import {
		Bold,
		Heading2,
		Heading3,
		Italic,
		Link2,
		List,
		ListOrdered,
		Quote,
		Redo2,
		Strikethrough,
		Underline,
		Undo2,
		Unlink,
		type LucideIcon
	} from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import * as Popover from '@civicos/shared/ui/popover';
	import { RICH_TEXT_PROSE_CLASS, toRichTextHtml } from '$lib/utils/rich-text';

	interface Props {
		/** Contents as HTML. Legacy plain text is normalized on the way in. */
		value: string;
		/** Serialized HTML after every edit; empty string when the doc is empty. */
		onChange: (html: string) => void;
		/** Applied to the contenteditable element, e.g. formsnap's control props. */
		attributes?: Record<string, string | undefined>;
		class?: string;
	}

	let { value, onChange, attributes, class: className }: Props = $props();

	// Prose styling has to land on the element Tiptap owns, so it goes through
	// editorProps rather than onto anything in this template.
	const CONTENT_CLASS = `min-h-32 px-3 py-2 focus:outline-none ${RICH_TEXT_PROSE_CLASS}`;

	let editor = $state<Editor>();

	// A Tiptap instance is not reactive, so the toolbar reads a snapshot that is
	// refreshed on every transaction (a bare cursor move changes what is active).
	let active = $state({
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		h2: false,
		h3: false,
		bulletList: false,
		orderedList: false,
		blockquote: false,
		link: false
	});
	let history = $state({ undo: false, redo: false });

	let linkOpen = $state(false);
	let linkHref = $state('');

	function refresh(instance: Editor) {
		active = {
			bold: instance.isActive('bold'),
			italic: instance.isActive('italic'),
			underline: instance.isActive('underline'),
			strike: instance.isActive('strike'),
			h2: instance.isActive('heading', { level: 2 }),
			h3: instance.isActive('heading', { level: 3 }),
			bulletList: instance.isActive('bulletList'),
			orderedList: instance.isActive('orderedList'),
			blockquote: instance.isActive('blockquote'),
			link: instance.isActive('link')
		};
		history = { undo: instance.can().undo(), redo: instance.can().redo() };
	}

	// Called from Tiptap's own callbacks, outside any tracking context, so it
	// reads the current `onChange` without the attachment depending on it.
	function emit(html: string) {
		onChange(html);
	}

	function mount(node: HTMLElement) {
		// Every prop read here is untracked: the attachment must set the editor up
		// once, not tear it down and rebuild it on each keystroke.
		const initial = untrack(() => toRichTextHtml(value));
		const extra = untrack(
			() =>
				Object.fromEntries(Object.entries(attributes ?? {}).filter(([, v]) => v != null)) as Record<
					string,
					string
				>
		);

		const instance = new Editor({
			element: node,
			extensions: [
				StarterKit.configure({
					// Participant-facing context copy: prose only, no code or rules.
					code: false,
					codeBlock: false,
					horizontalRule: false,
					heading: { levels: [2, 3] },
					link: { openOnClick: false }
				})
			],
			content: initial,
			editorProps: {
				attributes: {
					role: 'textbox',
					'aria-multiline': 'true',
					...extra,
					class: CONTENT_CLASS
				}
			},
			onTransaction: ({ editor: instance }) => refresh(instance),
			onUpdate: ({ editor: instance }) => emit(instance.isEmpty ? '' : instance.getHTML())
		});

		editor = instance;
		return () => {
			instance.destroy();
			editor = undefined;
		};
	}

	// Tiptap owns the document once mounted, so an external reset (form reset, a
	// reload that brings new data) has to be pushed in. Guarded against the echo
	// of our own onUpdate, which sets `value` to what the editor already holds.
	$effect(() => {
		const next = toRichTextHtml(value);
		const instance = editor;
		if (!instance) return;

		untrack(() => {
			if (next !== (instance.isEmpty ? '' : instance.getHTML())) {
				instance.commands.setContent(next, { emitUpdate: false });
			}
		});
	});

	function openLink(open: boolean) {
		linkOpen = open;
		if (open) linkHref = editor?.getAttributes('link').href ?? '';
	}

	function applyLink() {
		const chain = editor?.chain().focus().extendMarkRange('link');
		if (!chain) return;

		const href = linkHref.trim();
		if (href === '') chain.unsetLink().run();
		else chain.setLink({ href }).run();
		linkOpen = false;
	}
</script>

{#snippet tool(
	Icon: LucideIcon,
	label: string,
	run: () => void,
	isActive?: boolean,
	disabled?: boolean
)}
	<Button
		variant={isActive ? 'secondary' : 'ghost'}
		size="icon-sm"
		aria-label={label}
		aria-pressed={isActive}
		title={label}
		{disabled}
		onclick={run}
	>
		<Icon />
	</Button>
{/snippet}

<div
	class="rounded-[10px] border border-stone-300 focus-within:border-primary {className ?? ''}"
	data-slot="rich-text-editor"
>
	<div
		class="flex flex-wrap items-center gap-0.5 border-b border-stone-300 px-1.5 py-1"
		role="toolbar"
		aria-label="Text formatting"
	>
		{@render tool(Bold, 'Bold', () => editor?.chain().focus().toggleBold().run(), active.bold)}
		{@render tool(
			Italic,
			'Italic',
			() => editor?.chain().focus().toggleItalic().run(),
			active.italic
		)}
		{@render tool(
			Underline,
			'Underline',
			() => editor?.chain().focus().toggleUnderline().run(),
			active.underline
		)}
		{@render tool(
			Strikethrough,
			'Strikethrough',
			() => editor?.chain().focus().toggleStrike().run(),
			active.strike
		)}

		<div class="mx-1 h-5 w-px bg-stone-300" aria-hidden="true"></div>

		{@render tool(
			Heading2,
			'Heading',
			() => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
			active.h2
		)}
		{@render tool(
			Heading3,
			'Subheading',
			() => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
			active.h3
		)}
		{@render tool(
			List,
			'Bulleted list',
			() => editor?.chain().focus().toggleBulletList().run(),
			active.bulletList
		)}
		{@render tool(
			ListOrdered,
			'Numbered list',
			() => editor?.chain().focus().toggleOrderedList().run(),
			active.orderedList
		)}
		{@render tool(
			Quote,
			'Quote',
			() => editor?.chain().focus().toggleBlockquote().run(),
			active.blockquote
		)}

		<div class="mx-1 h-5 w-px bg-stone-300" aria-hidden="true"></div>

		<Popover.Root bind:open={() => linkOpen, openLink}>
			<Popover.Trigger
				aria-label="Link"
				title="Link"
				class="inline-flex size-8 items-center justify-center rounded-full transition-colors {active.link
					? 'bg-primary/10 text-primary'
					: 'hover:bg-accent hover:text-accent-foreground'}"
			>
				<Link2 class="size-4" />
			</Popover.Trigger>
			<Popover.Content align="start" class="w-72 space-y-2">
				<Input
					bind:value={linkHref}
					type="url"
					placeholder="https://example.org"
					aria-label="Link URL"
					onkeydown={(e) => e.key === 'Enter' && applyLink()}
				/>
				<div class="flex justify-end gap-2">
					<Button variant="ghost" size="sm" onclick={() => (linkOpen = false)}>Cancel</Button>
					<Button size="sm" onclick={applyLink}>Apply</Button>
				</div>
			</Popover.Content>
		</Popover.Root>

		{@render tool(
			Unlink,
			'Remove link',
			() => editor?.chain().focus().extendMarkRange('link').unsetLink().run(),
			undefined,
			!active.link
		)}

		<div class="mx-1 h-5 w-px bg-stone-300" aria-hidden="true"></div>

		{@render tool(
			Undo2,
			'Undo',
			() => editor?.chain().focus().undo().run(),
			undefined,
			!history.undo
		)}
		{@render tool(
			Redo2,
			'Redo',
			() => editor?.chain().focus().redo().run(),
			undefined,
			!history.redo
		)}
	</div>

	<div {@attach mount}></div>
</div>
