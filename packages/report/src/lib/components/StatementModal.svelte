<script lang="ts">
	import { GROUPS } from '../domain/bundled';
	import { titleCaseChip } from '../domain/copy';
	import { MIN_GROUP_VOTES, groupsOf } from '../domain/data';
	import { tierColorFor } from '../domain/verdict';
	import { closeStatement, modals, pageStatement, selection } from '../state.svelte';
	import LowDataFlag from './LowDataFlag.svelte';
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
			const card = [...document.querySelectorAll<HTMLElement>(`.icard[data-rid="${id}"]`)].find(
				(n) => n.offsetParent !== null
			);
			card?.focus({ preventScroll: true });
		});
	}
</script>

<ReportDialog
	open={Boolean(modals.statement)}
	label="Statement detail"
	variant="statementDialog"
	onclose={close}
	onpage={pageStatement}
>
	{#snippet header()}
		<!-- quotes carry no vote data, so they get no verdict badge -->
		{#if record?.vote}
			<VerdictPill vote={record.vote} variant="header" />
		{/if}
	{/snippet}

	{#snippet body()}
		<div class="cardbody" bind:this={scroller}>
			<div class="quotewrap" bind:this={quote}>
				<blockquote>“{record?.text ?? ''}”</blockquote>
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
					<section class="poll">
						<h4>Open poll responses · {record.vote.total} votes</h4>
						{#each rows as row (row.key)}
							<div class="grow">
								<div class="top">
									<span>{row.label}</span>
									<b style="color:{tierColorFor(row.pct)}"
										>{row.pct}% agree{#if row.n < MIN_GROUP_VOTES}<LowDataFlag
												votes={row.n}
												focusable
											/>{/if}</b
									>
								</div>
								<VoteBars tally={row} />
							</div>
						{/each}
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

<style>
	/* Below the quote everything is a shade of grey; the only colour is each
	   group's agree%, tiered by value like the statement card's. */
	:global(.statementDialog .cardtop) {
		padding: 14px 18px 14px 16px;
	}
	:global(.statementDialog .cardfoot) {
		padding: 12px 18px;
	}
	.quotewrap {
		padding: 28px 24px;
	}
	.quotewrap blockquote {
		font-size: 28px;
	}
	.meta {
		padding: 22px 24px 28px;
		border-top-color: color-mix(in srgb, var(--ink) 12%, transparent);
	}
	.meta h4 {
		font-size: 14.5px;
		color: color-mix(in srgb, var(--ink) 52%, transparent);
	}
	.meta section + section {
		margin-top: 16px;
		padding-top: 22px;
		border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
	}
	.poll h4 {
		margin-bottom: 14px;
	}
	.src {
		font-size: 16.5px;
		font-weight: 400;
		color: color-mix(in srgb, var(--ink) 82%, transparent);
	}
	.src small {
		font-size: 14.5px;
		color: color-mix(in srgb, var(--ink) 52%, transparent);
	}
	.grow {
		margin-bottom: 16px;
	}
	.grow .top {
		font-size: 14.5px;
		color: color-mix(in srgb, var(--ink) 75%, transparent);
		margin-bottom: 9px;
	}
	.grow .top span {
		text-transform: none;
		letter-spacing: 0.01em;
	}
	.grow .top b {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 14.5px;
		font-weight: 700;
		letter-spacing: 0;
	}
	.grow :global(.bar) {
		height: 6px;
	}
	@media (min-width: 660px) {
		:global(.statementDialog .card) {
			max-width: 620px;
		}
		:global(.statementDialog .cardtop) {
			padding: 18px 28px 18px 26px;
		}
		:global(.statementDialog .cardfoot) {
			padding: 15px 28px;
		}
		.quotewrap {
			padding: 40px 40px 34px;
		}
		.quotewrap blockquote {
			font-size: 33px;
		}
		.meta {
			padding: 30px 40px 40px;
		}
		.meta h4 {
			font-size: 18px;
		}
		.src {
			font-size: 19.5px;
		}
		.src small,
		.grow .top,
		.grow .top b {
			font-size: 18px;
		}
		.grow .top {
			margin-bottom: 11px;
		}
		.grow {
			margin-bottom: 20px;
		}
		.grow :global(.bar) {
			height: 7px;
		}
	}
</style>
