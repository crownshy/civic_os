<script lang="ts" module>
	/** One parsed statement, editable before it is posted. `id` is a stable `{#each}` key. */
	export type SeedDraft = {
		id: number;
		text: string;
	};
</script>

<script lang="ts">
	import { Trash2, TriangleAlert } from '@lucide/svelte';
	import Badge from '@civicos/shared/ui/Badge.svelte';
	import { TEXT_LIMITS, toOneLine } from '@civicos/shared/data/text-limits';
	import {
		blocksPosting,
		findSeedIssues,
		type ParsedSeedCsv,
		type SeedStatementIssue
	} from './seed-csv';

	interface Props {
		/** The parsed statements. Bound so edits and removals reach the posting dialog. */
		drafts: SeedDraft[];
		/** The parse the drafts came from: skipped heading, parser problems, columns. */
		parsed: ParsedSeedCsv;
		/** The Host picked another column to read the statements from. */
		onColumnChange: (index: number) => void;
		/** Every statement already in the poll, rejected ones included, for duplicate flags. */
		existing: string[];
		/** Posting is in flight: freeze the list so it matches what is being posted. */
		posting: boolean;
	}

	let { drafts = $bindable(), parsed, onColumnChange, existing, posting }: Props = $props();

	const issues = $derived(
		findSeedIssues(
			drafts.map((draft) => draft.text),
			existing
		)
	);

	const ISSUE_LABELS: Record<SeedStatementIssue, string> = {
		empty: 'Empty, will be skipped',
		'too-long': `Over ${TEXT_LIMITS.statement} characters. Shorten it to post.`,
		'duplicate-in-file': 'Repeated above. Delete it: Polis refuses repeats.',
		'duplicate-in-step': 'Already in this poll. Delete it: Polis refuses repeats.'
	};

	const blockingCount = $derived(issues.filter(blocksPosting).length);
	const plural = (n: number) => (n === 1 ? 'statement' : 'statements');

	function removeDraft(id: number) {
		drafts = drafts.filter((draft) => draft.id !== id);
	}
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3 font-ui">
	{#if parsed.columns.length > 0}
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<label for="seed-column" class="text-body font-medium">Take statements from</label>
			<select
				id="seed-column"
				value={parsed.column === null ? '' : String(parsed.column)}
				onchange={(e) => onColumnChange(Number(e.currentTarget.value))}
				disabled={posting}
				class="h-10 min-w-48 rounded-lg border border-input bg-background px-3 text-body outline-none focus-visible:border-ring disabled:opacity-50"
			>
				{#each parsed.columns as option (option.index)}
					<option value={String(option.index)}>{option.heading}</option>
				{/each}
			</select>
			<p class="text-caption text-muted-foreground">
				The file has {parsed.columns.length} columns. Switching reads the list again and drops your edits.
			</p>
		</div>
	{/if}

	<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
		<p class="text-body font-medium">
			{drafts.length}
			{plural(drafts.length)} read from the file
		</p>
		{#if blockingCount > 0}
			<p class="text-caption text-destructive" role="status">
				Fix {blockingCount} flagged {plural(blockingCount)} to post
			</p>
		{/if}
	</div>

	{#if parsed.header !== null && parsed.columns.length === 0}
		<p class="text-caption text-muted-foreground">Skipped the heading row "{parsed.header}".</p>
	{/if}

	<!-- A malformed file still parses, just wrongly: an unterminated quote swallows everything
	     after it into one statement, which looks plausible in the list below unless we say so. -->
	{#if parsed.problems.length > 0}
		<p class="text-caption text-destructive">
			That file is not quite valid CSV, so check the statements carefully: {parsed.problems[0]}
		</p>
	{/if}

	{#if drafts.length === 0}
		<p class="rounded-md bg-muted p-4 text-center text-body text-muted-foreground">
			Nothing left to post. Cancel and pick another file.
		</p>
	{:else}
		<!-- Fills the dialog's fixed height so a long import scrolls inside it, not off the screen. -->
		<ul class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
			{#each drafts as draft, index (draft.id)}
				{@const issue = issues[index]}
				<li class="flex items-start gap-2">
					<div class="flex flex-1 flex-col gap-1">
						<textarea
							bind:value={draft.text}
							oninput={() => {
								if (/[\r\n]/.test(draft.text)) draft.text = toOneLine(draft.text);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') e.preventDefault();
							}}
							rows="2"
							disabled={posting}
							aria-label={`Statement ${index + 1}`}
							class="w-full rounded-[10px] border border-input bg-background px-3 py-2 text-body focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
						></textarea>
						{#if issue}
							<Badge
								variant="soft"
								class="inline-flex items-center gap-1 self-start {blocksPosting(issue)
									? 'text-destructive'
									: ''}"
							>
								<TriangleAlert class="size-3.5" />
								{ISSUE_LABELS[issue]}
							</Badge>
						{/if}
					</div>
					<button
						type="button"
						disabled={posting}
						onclick={() => removeDraft(draft.id)}
						title={`Remove statement ${index + 1}`}
						aria-label={`Remove statement ${index + 1}`}
						class="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Trash2 class="size-4" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
