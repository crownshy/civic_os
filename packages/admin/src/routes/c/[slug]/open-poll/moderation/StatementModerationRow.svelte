<script lang="ts">
	import { Check, X } from '@lucide/svelte';
	import type { PolisStatementAux } from '$lib/types/aux';
	import RowAccentStripe from '$lib/components/insights/RowAccentStripe.svelte';

	interface Props {
		row: PolisStatementAux;
		selected: boolean;
		/** How many rows are selected overall; decides whether accept/reject acts on all of them. */
		selectionCount: number;
		/** This row has an accept/reject request in flight. */
		pending: boolean;
		/** A bulk moderation is running for the whole table. */
		bulkWorking: boolean;
		/** `range` is true when shift was held, asking for a range select. */
		onToggle: (checked: boolean, range: boolean) => void;
		onModerate: (status: 'accepted' | 'rejected') => void;
	}

	let { row, selected, selectionCount, pending, bulkWorking, onToggle, onModerate }: Props =
		$props();

	// Inside a multi-selection the parent routes accept/reject through the bulk
	// path, so the controls stay enabled and say so, rather than implying one row.
	const actsOnSelection = $derived(selected && selectionCount > 1);
	const acceptTitle = $derived(actsOnSelection ? `Accept ${selectionCount} selected` : 'Accept');
	const rejectTitle = $derived(actsOnSelection ? `Reject ${selectionCount} selected` : 'Reject');

	const accent = $derived(
		row.is_seed
			? 'bg-muted-foreground/40'
			: row.moderation_status === 'accepted'
				? 'bg-success'
				: row.moderation_status === 'rejected'
					? 'bg-destructive'
					: 'bg-destructive/60'
	);

	// A plain `let`, not `$state`: a transient input snapshot that must not drive
	// reactivity. Captured before the checkbox's own change handler, which gets no
	// modifier keys, and on keydown too, since Space fires no mousedown.
	let shiftHeld = false;
	const snapshotShift = (e: MouseEvent | KeyboardEvent) => {
		shiftHeld = e.shiftKey;
	};

	const isControl = (e: Event) => !!(e.target as HTMLElement).closest('[data-row-control]');
</script>

<!-- The row click is a mouse shortcut; the checkbox is the keyboard path. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	onmousedowncapture={(e) => {
		snapshotShift(e);
		// Stops shift-click from highlighting the text between rows.
		if (e.shiftKey) e.preventDefault();
	}}
	onkeydowncapture={snapshotShift}
	onclick={(e) => {
		if (bulkWorking || isControl(e)) return;
		onToggle(!selected, shiftHeld);
	}}
	class={`group relative grid cursor-pointer grid-cols-[1.5rem_1.5rem_minmax(0,1fr)_auto] items-start gap-4 border-b border-border py-4 pl-4 transition-colors duration-150 last:border-b-0 ${
		selected ? 'bg-primary/5' : 'hover:bg-muted/40'
	}`}
>
	<RowAccentStripe {accent} />

	<div class="flex items-center self-center" data-row-control>
		<input
			type="checkbox"
			checked={selected}
			disabled={bulkWorking}
			onchange={(e) => onToggle(e.currentTarget.checked, shiftHeld)}
			aria-label={`Select statement ${row.polis_statement_id}`}
			class="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
		/>
	</div>

	<div class="pt-1 text-center font-ui text-label text-muted-foreground tabular-nums">
		{row.polis_statement_id}
	</div>

	<p class="min-w-0 font-ui text-body-lg font-medium text-foreground">
		{row.statement_text}
	</p>

	<div class="flex items-center gap-2 self-center pr-4" data-row-control>
		<button
			type="button"
			disabled={pending ||
				bulkWorking ||
				(!actsOnSelection && row.moderation_status === 'accepted')}
			onclick={() => onModerate('accepted')}
			title={acceptTitle}
			aria-label={acceptTitle}
			class="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-success transition-all duration-150 hover:scale-110 hover:bg-success/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
		>
			<Check class="size-6" />
		</button>
		<button
			type="button"
			disabled={pending ||
				bulkWorking ||
				(!actsOnSelection && row.moderation_status === 'rejected')}
			onclick={() => onModerate('rejected')}
			title={rejectTitle}
			aria-label={rejectTitle}
			class="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-destructive transition-all duration-150 hover:scale-110 hover:bg-destructive/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
		>
			<X class="size-6" />
		</button>
	</div>
</div>
