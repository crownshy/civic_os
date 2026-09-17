<script lang="ts">
	import { ArrowDown, ArrowUp, Pencil, Trash2 } from '@lucide/svelte';
	import SetupCard from './SetupCard.svelte';
	import EditFaqDialog from './EditFaqDialog.svelte';
	import { faqAnswerToText, toFaqKey, type FaqEntry } from '@civicos/shared/data/faq';

	interface Props {
		title: string;
		subtitle: string;
		/** Current entries, parsed from `Conversation.faqs`. */
		entries: FaqEntry[];
		/**
		 * Persist the whole list. It is one text field on the backend, so every
		 * edit rewrites all of it; there is no per-entry write to make.
		 */
		onSave: (next: FaqEntry[]) => Promise<void>;
	}

	let { title, subtitle, entries, onSave }: Props = $props();

	/** Index being edited, -1 for a new entry, null when the dialog is closed. */
	let editing = $state<number | null>(null);
	let pending = $state<string | null>(null);
	let error = $state<string | null>(null);

	const editingEntry = $derived(
		editing === null || editing < 0 ? null : (entries[editing] ?? null)
	);

	/** Shared write wrapper: one in-flight marker plus one error surface. */
	async function run(key: string, next: FaqEntry[]) {
		if (pending) return;
		pending = key;
		error = null;
		try {
			await onSave(next);
		} catch (e) {
			console.error('Saving the FAQ failed', e);
			error = e instanceof Error ? e.message : 'Could not save that change.';
		} finally {
			pending = null;
		}
	}

	function move(i: number, delta: number) {
		const to = i + delta;
		if (to < 0 || to >= entries.length) return;
		const next = [...entries];
		[next[i], next[to]] = [next[to], next[i]];
		return run(`move-${i}`, next);
	}

	const remove = (i: number) =>
		run(
			`remove-${i}`,
			entries.filter((_, index) => index !== i)
		);

	/** Commit the dialog: replace the entry being edited, or append a new one. */
	function commit(entry: FaqEntry) {
		const at = editing;
		if (at === null) return Promise.resolve();
		const next =
			at < 0 ? [...entries, entry] : entries.map((e, index) => (index === at ? entry : e));
		return run(at < 0 ? 'add' : `edit-${at}`, next);
	}
</script>

<SetupCard {title} {subtitle}>
	<div class="font-ui">
		{#if error}
			<p class="mb-3 text-body text-destructive">{error}</p>
		{/if}

		{#if entries.length > 0}
			<div
				class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-4 px-2 pb-2 text-caption font-semibold text-muted-foreground uppercase"
			>
				<div>Question</div>
				<div>Answer</div>
				<div class="text-right">Order</div>
			</div>
		{/if}

		<div class="divide-y divide-border">
			{#each entries as entry, i (toFaqKey(entry.question, i))}
				<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-start gap-4 px-2 py-5">
					<div class="text-body font-bold">{entry.question}</div>
					<div class="text-body font-medium whitespace-pre-line">
						{faqAnswerToText(entry.answer) || 'No answer yet.'}
					</div>
					<div class="flex shrink-0 items-center gap-3">
						<button
							type="button"
							onclick={() => move(i, -1)}
							disabled={i === 0 || !!pending}
							aria-label={`Move "${entry.question}" up`}
							class="cursor-pointer touch-manipulation text-foreground transition-all hover:text-primary active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-25 disabled:active:scale-100"
						>
							<ArrowUp class="size-4" />
						</button>
						<button
							type="button"
							onclick={() => move(i, 1)}
							disabled={i === entries.length - 1 || !!pending}
							aria-label={`Move "${entry.question}" down`}
							class="cursor-pointer touch-manipulation text-foreground transition-all hover:text-primary active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-25 disabled:active:scale-100"
						>
							<ArrowDown class="size-4" />
						</button>
						<button
							type="button"
							onclick={() => (editing = i)}
							disabled={!!pending}
							aria-label={`Edit "${entry.question}"`}
							class="cursor-pointer touch-manipulation text-primary transition-all hover:text-primary/80 active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
						>
							<Pencil class="size-4" />
						</button>
						<button
							type="button"
							onclick={() => remove(i)}
							disabled={!!pending}
							aria-label={`Delete "${entry.question}"`}
							title="Delete this question"
							class="cursor-pointer touch-manipulation p-1 text-muted-foreground transition-all hover:text-destructive active:scale-90 active:text-destructive/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
						>
							<Trash2 class="size-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<button
			type="button"
			onclick={() => (editing = -1)}
			disabled={!!pending}
			class="flex w-full cursor-pointer items-center gap-1 border-t border-border px-2 py-4 text-body font-bold text-primary transition-colors hover:bg-muted/40 active:bg-foreground/10 active:duration-0 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{pending ? 'Saving…' : 'Add New…'}
		</button>
	</div>
</SetupCard>

<!-- Keyed so each open gets a fresh dialog, which is how its fields get seeded
     from the entry being edited. Without this, a controlled `open` going true
     does not fire bits-ui's `onOpenChange`, and reopening the dialog showed
     whatever was last typed into it. `editing` passes through null on close, so
     re-editing the same row is still a key change. -->
{#key editing}
	<EditFaqDialog
		open={editing !== null}
		entry={editingEntry}
		existing={entries}
		editingIndex={editing}
		onClose={() => (editing = null)}
		onSave={commit}
	/>
{/key}
