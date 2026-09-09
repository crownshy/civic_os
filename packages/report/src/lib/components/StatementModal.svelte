<script lang="ts">
	import { GROUPS } from '../domain/bundled';
	import { titleCaseChip } from '../domain/copy';
	import { groupsOf } from '../domain/data';
	import { closeStatement, modals, pageStatement, selection } from '../state.svelte';
	import ReportDialog from './ReportDialog.svelte';
	import VerdictPill from './VerdictPill.svelte';
	import VoteBars from './VoteBars.svelte';

	const record = $derived(modals.statement?.view[modals.statement.index]);
	const count = $derived(modals.statement?.view.length ?? 0);
	const index = $derived(modals.statement?.index ?? 0);

	const participant = $derived.by(() => {
		if (!record) return '';
		if (record.origin === 'cocap_seed') return 'Host statement';
		return (record.chips.length ? record.chips : ['Anonymous']).map(titleCaseChip).join(', ');
	});

	const rows = $derived(record?.vote ? groupsOf(GROUPS, record.vote) : []);

	let scroller = $state<HTMLDivElement>();
	let quote = $state<HTMLDivElement>();

	/**
	 * A long statement creeps into view on its own after a beat, so the reader
	 * sees there is more without having to scroll, and stops for good at the
	 * first sign of input, or once the quote is fully shown. It never scrolls on
	 * into the metadata below.
	 */
	$effect(() => {
		void index;
		const el = scroller;
		if (!el) return;
		el.scrollTop = 0;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let frame = 0;
		let stopped = false;
		const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
		const stop = () => {
			stopped = true;
			cancelAnimationFrame(frame);
			events.forEach((e) => el.removeEventListener(e, stop));
		};
		events.forEach((e) => el.addEventListener(e, stop, { passive: true }));

		const limit = () =>
			Math.max(
				0,
				Math.min(
					el.scrollHeight - el.clientHeight,
					(quote?.offsetHeight ?? 0) - el.clientHeight + 20
				)
			);

		const start = performance.now();
		const step = (now: number) => {
			if (stopped) return;
			const over = limit();
			if (over < 6) return stop();
			if (now - start > 1800) el.scrollTop = Math.min(over, (now - start - 1800) * 0.016);
			if (el.scrollTop >= over - 1) return stop();
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);

		return stop;
	});

	// keys the dark reading treatment app.css puts on the page behind the modal
	$effect(() => {
		const open = Boolean(modals.statement);
		document.body.classList.toggle('reading', open);
		return () => document.body.classList.remove('reading');
	});

	/**
	 * Focus goes back to the card you came from, so a keyboard user lands where
	 * they were rather than at the top of the document. A record can be marked
	 * on more than one page, so focus the instance actually on screen,
	 * offsetParent is null for anything inside a display:none subtree.
	 */
	function close() {
		const id = selection.recordId;
		closeStatement();
		if (!id) return;
		queueMicrotask(() => {
			const card = [
				...document.querySelectorAll<HTMLElement>(
					`.icard[data-rid="${id}"], .lcard[data-rid="${id}"]`
				)
			].find((n) => n.offsetParent !== null);
			card?.focus({ preventScroll: true });
		});
	}
</script>

<ReportDialog
	open={Boolean(modals.statement)}
	label="Statement detail"
	onclose={close}
	onpage={pageStatement}
>
	{#snippet header()}
		<!-- quotes carry no vote data, so they get no verdict badge -->
		{#if record?.vote}
			<VerdictPill vote={record.vote} />
		{/if}
	{/snippet}

	{#snippet body()}
		<div class="cardbody" bind:this={scroller}>
			<div class="quotewrap" bind:this={quote}>
				<blockquote style="--qs:30px">“{record?.text ?? ''}”</blockquote>
			</div>
			<div class="meta">
				<section>
					<h4>Source</h4>
					<p class="src">
						{record?.source ?? ''}
						<small>Participant: {participant}</small>
					</p>
				</section>

				{#if record?.vote}
					<section>
						<h4>Open poll responses · {record.vote.total} votes</h4>
						{#each rows as row (row.key)}
							<div class="grow">
								<div class="top">
									<span>{row.label}</span>
									<b>{row.pct}% agree</b>
								</div>
								<VoteBars tally={row} />
							</div>
						{/each}
						<div class="barkey">
							<span><i class="d"></i>Disagree</span>
							<span><i class="p"></i>Pass</span>
							<span><i class="a"></i>Agree</span>
						</div>
					</section>
				{/if}

				{#if record?.tags.length}
					<section>
						<h4>Tags</h4>
						<div class="tags">
							{#each record.tags as tag (tag)}<i>{tag}</i>{/each}
						</div>
					</section>
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="cardfoot">
			<button
				aria-label="Previous statement"
				disabled={index === 0}
				onclick={() => pageStatement(-1)}
			>
				<svg viewBox="0 0 26 14" aria-hidden="true"
					><path
						d="M25 7H1.6M7.4 1.4L1.2 7l6.2 5.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</button>
			<div class="pos">{index + 1} <em>|</em> {count}</div>
			<button
				aria-label="Next statement"
				disabled={index === count - 1}
				onclick={() => pageStatement(1)}
			>
				<svg viewBox="0 0 26 14" aria-hidden="true"
					><path
						d="M1 7h23.4M18.6 1.4L24.8 7l-6.2 5.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</button>
		</div>
	{/snippet}
</ReportDialog>
