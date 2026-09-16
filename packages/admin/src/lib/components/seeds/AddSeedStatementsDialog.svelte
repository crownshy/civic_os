<script lang="ts">
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import { Plus, Upload } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { parseSeedCsv } from './seed-csv';

	interface Props {
		/** Post one statement to Polis. Called once per statement, in order. */
		onPost: (text: string) => Promise<void>;
		/** Pull the new comments back into aux. Runs once, after the last post. */
		onPosted: () => Promise<void>;
		/** Resolves with how many went in, for the page's status line. */
		onDone?: (count: number) => void;
		disabled?: boolean;
		/** Replaces the default button, for surfaces with their own add affordance. */
		trigger?: Snippet<[{ open: () => void; disabled: boolean }]>;
	}

	let { onPost, onPosted, onDone, disabled = false, trigger }: Props = $props();

	let open = $state(false);
	let draft = $state('');
	let error = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement>();

	// Which path is in flight, so only its own button says so.
	let mode = $state<'single' | 'csv' | null>(null);
	const busy = $derived(mode !== null);

	let postedCount = $state(0);
	let totalCount = $state(0);

	/**
	 * Polis has no batch create, so a CSV is N sequential posts. If one fails
	 * midway the earlier ones are already in Polis: they are still synced, and the
	 * error says how far it got, so a retry can start from the right line instead
	 * of posting duplicates.
	 */
	async function postSeeds(texts: string[]) {
		postedCount = 0;
		totalCount = texts.length;
		let failure: unknown = null;
		for (const text of texts) {
			try {
				await onPost(text);
				postedCount += 1;
			} catch (e) {
				failure = e;
				break;
			}
		}
		if (postedCount > 0) await onPosted();
		if (failure !== null) {
			console.error('postSeed failed', failure);
			throw new Error(
				texts.length > 1
					? `Added ${postedCount} of ${texts.length}, then statement ${postedCount + 1} failed. Remove the first ${postedCount} lines before importing again.`
					: 'Could not add the statement.'
			);
		}
	}

	async function run(which: 'single' | 'csv', texts: () => Promise<string[]>) {
		mode = which;
		error = null;
		try {
			const list = await texts();
			await postSeeds(list);
			draft = '';
			open = false;
			onDone?.(list.length);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not add the statements.';
		} finally {
			mode = null;
		}
	}

	function addSingle() {
		const text = draft.trim();
		if (!text || busy) return;
		run('single', async () => [text]);
	}

	function importCsv(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Cleared up front so choosing the same file again after a fix still fires.
		input.value = '';
		if (!file || busy) return;
		run('csv', async () => {
			if (!/\.(csv|txt)$/i.test(file.name)) throw new Error('Choose a .csv or .txt file.');
			const lines = parseSeedCsv(await file.text());
			if (!lines.length) throw new Error('No statements found in that file.');
			return lines;
		});
	}

	function onOpenChange(next: boolean) {
		if (!next) error = null;
	}
</script>

{#if trigger}
	{@render trigger({ open: () => (open = true), disabled })}
{:else}
	<Button onclick={() => (open = true)} {disabled} title="Add seed statements as moderator">
		<Plus class="size-4" />
		Add seed statements
	</Button>
{/if}

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content
		class="sm:max-w-xl"
		showCloseButton={!busy}
		onInteractOutside={(e) => busy && e.preventDefault()}
		onEscapeKeydown={(e) => busy && e.preventDefault()}
	>
		<Dialog.Header>
			<Dialog.Title class="text-lg font-medium md:text-h4">Add seed statements</Dialog.Title>
			<Dialog.Description class="text-body">
				Post statements to seed the conversation, or import many at once from a CSV.
			</Dialog.Description>
		</Dialog.Header>

		<div class="relative flex flex-col gap-3 font-ui" aria-busy={busy}>
			{#if busy}
				<div
					class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/50 backdrop-blur-[1px]"
				>
					<Spinner class="size-6 text-muted-foreground" />
					{#if totalCount > 1}
						<p class="text-caption text-muted-foreground tabular-nums" aria-live="polite">
							Posting {Math.min(postedCount + 1, totalCount)} / {totalCount}
						</p>
					{/if}
				</div>
			{/if}

			<label class="text-caption font-medium text-muted-foreground" for="seed-text">
				Write a statement
			</label>
			<textarea
				id="seed-text"
				bind:value={draft}
				rows="3"
				placeholder="Write a seed statement…"
				disabled={busy}
				class="w-full rounded-[10px] border border-input bg-background px-3 py-2 text-body focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			></textarea>

			<div class="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
				<span>or</span>
				<Button
					variant="secondary"
					size="sm"
					onclick={() => fileInput?.click()}
					disabled={busy}
					title="Import seed statements from a CSV (one statement per line)"
				>
					<Upload class="size-4" />
					{mode === 'csv' ? 'Importing…' : 'Import CSV'}
				</Button>
				<span>to add many at once, one statement per line</span>
			</div>
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv,.txt"
				class="hidden"
				onchange={importCsv}
			/>

			{#if error}
				<p class="text-caption text-destructive" role="alert">{error}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (open = false)} disabled={busy}>Cancel</Button>
			<Button onclick={addSingle} disabled={!draft.trim() || busy}>
				{mode === 'single' ? 'Posting…' : 'Post seed'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
