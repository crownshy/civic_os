<script lang="ts">
	import { untrack } from 'svelte';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import SetupField from './SetupField.svelte';
	import { faqAnswerToHtml, faqAnswerToText, type FaqEntry } from '@civicos/shared/data/faq';

	interface Props {
		open: boolean;
		/** The entry being edited, or null when adding a new one. */
		entry: FaqEntry | null;
		/** The whole list, for the duplicate-question check. */
		existing: FaqEntry[];
		/** Index being edited, -1 when adding. Excluded from the duplicate check. */
		editingIndex: number | null;
		onClose: () => void;
		onSave: (entry: FaqEntry) => Promise<void>;
	}

	// `open` is a plain prop rather than `$bindable`, unlike the other Setup
	// dialogs: the parent's source of truth is *which* entry is open, not whether
	// one is, so a binding here would be a second copy of that state.
	let { open, entry, existing, editingIndex, onClose, onSave }: Props = $props();

	// Seeded once, at mount, because the parent remounts this component per open
	// (`{#key editing}`). That is load bearing: bits-ui calls `onOpenChange` only
	// for changes it initiates, so a controlled `open` going true does not fire
	// it, and seeding there left the previous draft in the fields on reopen.
	//
	// `untrack` says that one-time read is deliberate rather than a missed
	// derived, the same way Setup's `initialFields` does: these are the editable
	// working copy, and the entry they came from must not overwrite them midway
	// through being typed into.
	//
	// The stored answer is block HTML and this field is plain text, so it
	// converts on the way in and back again on save.
	let question = $state(untrack(() => entry?.question ?? ''));
	let answer = $state(untrack(() => (entry ? faqAnswerToText(entry.answer) : '')));
	let submitting = $state(false);
	let error = $state<string | null>(null);

	// Withheld until they have started, so an untouched dialog is not already
	// scolding.
	const started = $derived(!!question.trim() || !!answer.trim());

	const problem = $derived.by(() => {
		const asked = question.trim();
		if (!asked) return 'Give the question a name.';
		if (!answer.trim()) return 'Write an answer.';

		const clash = existing.some(
			(e, i) => i !== editingIndex && e.question.trim().toLowerCase() === asked.toLowerCase()
		);
		if (clash) return 'That question is already in the list.';
		return null;
	});

	/** Escape and the overlay close through here; the parent owns `open`. */
	function onOpenChange(next: boolean) {
		if (!next) onClose();
	}

	/** Focus on mount, so an opened dialog is ready to type into. */
	function takeFocus(node: HTMLInputElement) {
		node.focus({ preventScroll: true });
		node.select();
	}

	async function save() {
		if (problem || submitting) return;
		submitting = true;
		error = null;
		try {
			await onSave({ question: question.trim(), answer: faqAnswerToHtml(answer) });
			onClose();
		} catch (e) {
			console.error('Saving the FAQ entry failed', e);
			error = e instanceof Error ? e.message : 'Could not save the question.';
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content
		class="flex max-h-[85vh] w-[min(92vw,720px)] flex-col overflow-hidden font-ui sm:max-w-[720px]"
	>
		<Dialog.Header class="shrink-0">
			<Dialog.Title class="font-display text-h4 font-semibold md:text-h3">
				{entry ? 'Edit Question' : 'Add New Question'}
			</Dialog.Title>
			<Dialog.Description class="text-body text-foreground/70">
				Questions appear on the Campaign homepage as an expandable list, in the order set here.
			</Dialog.Description>
		</Dialog.Header>

		<div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
			<div class="flex flex-col gap-8 py-2">
				<SetupField label="Question">
					<input
						bind:value={question}
						{@attach takeFocus}
						placeholder="e.g. Are my responses anonymous?"
						class="w-full rounded-[10px] border border-input bg-background px-4 py-4 text-body-lg font-semibold focus:ring-2 focus:ring-ring focus:outline-none"
					/>
				</SetupField>

				<SetupField label="Answer">
					<textarea
						bind:value={answer}
						rows="6"
						placeholder="Keep it short. A blank line starts a new paragraph."
						onkeydown={(e) => {
							// Otherwise the dialog swallows Escape and the whole entry is lost.
							if (e.key === 'Escape') e.stopPropagation();
						}}
						class="w-full resize-y rounded-[10px] border border-input bg-background px-4 py-3 text-body font-medium focus:ring-2 focus:ring-ring focus:outline-none"
					></textarea>
					<p class="mt-1.5 text-caption text-foreground/60">
						Plain text. Links are not supported here yet, so spell out any web address.
					</p>
				</SetupField>

				{#if error}
					<p class="text-body text-destructive">{error}</p>
				{/if}
			</div>
		</div>

		<Dialog.Footer
			class="shrink-0 items-stretch gap-3 border-t border-border pt-4 sm:items-center sm:justify-between"
		>
			{#if started && problem}
				<p class="min-w-0 text-body text-foreground/70">{problem}</p>
			{/if}
			<div class="flex shrink-0 gap-2 sm:ml-auto">
				<Button variant="secondary" onclick={onClose} disabled={submitting}>Cancel</Button>
				<Button onclick={save} disabled={!!problem || submitting}>
					{submitting ? 'Saving…' : 'Save question'}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
