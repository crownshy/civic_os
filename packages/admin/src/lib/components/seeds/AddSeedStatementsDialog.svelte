<script lang="ts">
	import CharCount from '$lib/components/CharCount.svelte';
	import { polisFailure } from '$lib/api/describe-failure';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import { Plus, Upload } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { TEXT_LIMITS, toOneLine } from '@civicos/shared/data/text-limits';
	import {
		blocksPosting,
		findSeedIssues,
		parseSeedCsv,
		seedProblem,
		type ParsedSeedCsv
	} from './seed-csv';
	import SeedStatementsPreview, { type SeedDraft } from './SeedStatementsPreview.svelte';

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
		/** Statements already in the poll, so a repeat is caught before it posts. */
		existing?: string[];
	}

	let { onPost, onPosted, onDone, disabled = false, trigger, existing = [] }: Props = $props();

	let open = $state(false);
	let draft = $state('');
	let error = $state<string | null>(null);
	// Set when statements went in but the list behind the dialog did not reload. Kept apart
	// from `error` because nothing failed to post, and a retry would post them twice (#472).
	let staleNotice = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement>();

	// The parsed file waiting on the Host's confirmation. Nothing is posted while it is on
	// screen: the Host checks, edits or removes lines first.
	let parsed = $state.raw<ParsedSeedCsv | null>(null);
	// Its own state rather than derived from `parsed`, so edits in the preview are reactive.
	let drafts = $state<SeedDraft[]>([]);
	// Kept so picking another column can re-read the file without asking for it again.
	let fileText = '';
	let nextDraftId = 0;
	const previewing = $derived(parsed !== null);
	const postable = $derived(drafts.map((d) => d.text.trim()).filter(Boolean));
	// The same check the preview flags lines with, so the button and the flags agree.
	const blocked = $derived(
		findSeedIssues(
			drafts.map((d) => d.text),
			existing
		).some(blocksPosting)
	);

	// Which path is in flight, so only its own button says so.
	let mode = $state<'single' | 'csv' | 'reading' | null>(null);
	const busy = $derived(mode !== null);

	let postedCount = $state(0);
	let totalCount = $state(0);

	const plural = (n: number) => `${n} ${n === 1 ? 'statement' : 'statements'}`;

	/** A 403 or 422 from Polis, as a sentence ending in a space, or '' for anything else. */
	const polisReason = (failure: unknown, action: string) => {
		const reason = polisFailure(failure, action);
		return reason ? `${reason} ` : '';
	};

	/**
	 * Posts each statement in order, stopping at the first failure. Polis has no batch create
	 * and a post cannot be undone, so a partial batch is reported, not rolled back.
	 */
	async function postSeeds(texts: string[]): Promise<{ posted: number; failure: unknown }> {
		postedCount = 0;
		totalCount = texts.length;
		for (const text of texts) {
			try {
				await onPost(text);
			} catch (e) {
				console.error('postSeed failed', e);
				return { posted: postedCount, failure: e };
			}
			postedCount += 1;
		}
		return { posted: postedCount, failure: null };
	}

	/** Shared ending for both paths once at least one statement went in. */
	async function afterPosting(posted: number) {
		try {
			await onPosted();
		} catch (e) {
			console.error('Refreshing after seeding failed', e);
			const reason = polisReason(e, 'sync statements from Polis');
			staleNotice = `Posted ${plural(posted)}, but the list did not refresh. ${reason}Reload the page to see ${posted === 1 ? 'it' : 'them'}. Do not post ${posted === 1 ? 'it' : 'them'} again.`;
		}
	}

	async function addSingle() {
		const text = draft.trim();
		if (!text || busy) return;
		error = null;
		staleNotice = null;
		const problem = seedProblem([text], existing);
		if (problem) {
			error = problem;
			return;
		}

		mode = 'single';
		const { posted, failure } = await postSeeds([text]);
		if (posted === 0) {
			mode = null;
			error = polisFailure(failure, 'add seed statements') ?? 'Could not add the statement.';
			return;
		}
		draft = '';
		await afterPosting(posted);
		mode = null;
		onDone?.(posted);
		if (!staleNotice) open = false;
	}

	/** Reads and parses the picked file into the preview. Posts nothing. */
	async function previewCsv(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Cleared up front so choosing the same file again after a fix still fires.
		input.value = '';
		if (!file || busy) return;
		error = null;
		staleNotice = null;

		if (!/\.(csv|txt)$/i.test(file.name)) {
			error = 'Choose a .csv or .txt file.';
			return;
		}

		mode = 'reading';
		try {
			const text = await file.text();
			const next = await parseSeedCsv(text);
			// A multi-column file can have an empty default column and statements in another,
			// so only give up when there is no column to switch to.
			if (next.statements.length === 0 && next.columns.length === 0) {
				error = 'No statements found in that file.';
				return;
			}
			fileText = text;
			showParsed(next);
		} catch (err) {
			console.error('Reading the seed CSV failed', err);
			error = 'Could not read that file.';
		} finally {
			mode = null;
		}
	}

	function showParsed(next: ParsedSeedCsv) {
		parsed = next;
		drafts = next.statements.map((text) => ({ id: nextDraftId++, text }));
	}

	/** Re-reads the file from another column. Replaces the list, edits and removals included. */
	async function pickColumn(index: number) {
		if (index === parsed?.column || busy) return;
		try {
			showParsed(await parseSeedCsv(fileText, index));
		} catch (err) {
			console.error('Reading the seed CSV column failed', err);
			error = 'Could not read that column.';
		}
	}

	function discardImport() {
		parsed = null;
		drafts = [];
		fileText = '';
	}

	async function confirmImport() {
		const texts = postable;
		if (texts.length === 0 || blocked || busy) return;
		error = null;
		staleNotice = null;
		mode = 'csv';

		const { posted, failure } = await postSeeds(texts);
		if (posted > 0) await afterPosting(posted);
		mode = null;

		if (posted < texts.length) {
			error = `Posted ${posted} of ${texts.length}, then "${shorten(texts[posted])}" failed. ${polisReason(failure, 'add seed statements')}The rest were not posted.`;
			// Posting walks the non-empty drafts in order, so the first `posted` of them went in.
			// Drop those and leave the rest on screen to retry or remove.
			let landed = posted;
			drafts = drafts.filter((d) => {
				if (landed > 0 && d.text.trim()) {
					landed -= 1;
					return false;
				}
				return true;
			});
			if (posted > 0) onDone?.(posted);
			return;
		}

		discardImport();
		onDone?.(posted);
		if (!staleNotice) open = false;
	}

	/** Longest a statement is quoted in an error before it is cut short. */
	const shorten = (text: string) => (text.length > 60 ? `${text.slice(0, 60)}…` : text);

	// Closing throws the preview away, so the poll is left untouched. `onOpenChange` covers
	// the X and Escape; Cancel calls `close` itself.
	function reset() {
		error = null;
		staleNotice = null;
		discardImport();
	}

	function close() {
		reset();
		open = false;
	}

	function onOpenChange(next: boolean) {
		if (!next) reset();
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
		class={previewing ? 'flex h-[80vh] flex-col sm:max-w-4xl' : 'sm:max-w-xl'}
		showCloseButton={!busy}
		onInteractOutside={(e) => busy && e.preventDefault()}
		onEscapeKeydown={(e) => busy && e.preventDefault()}
	>
		<Dialog.Header>
			<Dialog.Title class="text-lg font-medium md:text-h4">
				{previewing ? 'Check before posting' : 'Add seed statements'}
			</Dialog.Title>
			<Dialog.Description class="text-body">
				{#if previewing}
					Edit or remove anything that looks wrong. Nothing is posted until you confirm, and posting
					cannot be undone.
				{:else}
					Post statements to seed the conversation, or import many at once from a CSV.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="relative flex min-h-0 flex-1 flex-col gap-3 font-ui" aria-busy={busy}>
			{#if busy}
				<div
					class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/50 backdrop-blur-[1px]"
				>
					<Spinner class="size-6 text-muted-foreground" />
					{#if totalCount > 1 && mode === 'csv'}
						<p class="text-caption text-muted-foreground tabular-nums" aria-live="polite">
							Posting {Math.min(postedCount + 1, totalCount)} / {totalCount}
						</p>
					{/if}
				</div>
			{/if}

			{#if staleNotice}
				<p class="text-caption text-foreground" role="status">{staleNotice}</p>
			{/if}

			{#if parsed}
				<SeedStatementsPreview
					bind:drafts
					{parsed}
					onColumnChange={pickColumn}
					{existing}
					posting={busy}
				/>
			{:else}
				<label class="text-caption font-medium text-muted-foreground" for="seed-text">
					Write a statement
				</label>
				<textarea
					id="seed-text"
					bind:value={draft}
					oninput={() => {
						if (/[\r\n]/.test(draft)) draft = toOneLine(draft);
					}}
					onkeydown={(e) => {
						// Seeds are statements, and statements are one line (#465).
						if (e.key === 'Enter') e.preventDefault();
					}}
					rows="3"
					placeholder="Write a seed statement…"
					disabled={busy}
					class="w-full rounded-[10px] border border-input bg-background px-3 py-2 text-body focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
				></textarea>
				<!-- No maxlength: a paste cut short at 240 lost its tail without a word.
				     Counted trimmed, as seedProblem measures it. -->
				<CharCount count={draft.trim().length} limit={TEXT_LIMITS.statement} />

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
						{mode === 'reading' ? 'Reading…' : 'Import CSV'}
					</Button>
					<span>to add many at once. You can check them before anything is posted.</span>
				</div>
				<input
					bind:this={fileInput}
					type="file"
					accept=".csv,.txt"
					class="hidden"
					onchange={previewCsv}
				/>
			{/if}

			{#if error}
				<p class="text-caption text-destructive" role="alert">{error}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="secondary" onclick={close} disabled={busy}>
				{staleNotice ? 'Close' : 'Cancel'}
			</Button>
			{#if previewing}
				<Button onclick={confirmImport} disabled={postable.length === 0 || blocked || busy}>
					{mode === 'csv' ? 'Posting…' : `Post ${plural(postable.length)}`}
				</Button>
			{:else}
				<Button
					onclick={addSingle}
					disabled={!draft.trim() || draft.trim().length > TEXT_LIMITS.statement || busy}
				>
					{mode === 'single' ? 'Posting…' : 'Post seed'}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
