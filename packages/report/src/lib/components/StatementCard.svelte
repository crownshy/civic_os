<script lang="ts">
	import { GROUPS } from '../domain/bundled';
	import { demoLineFor, emojiFor } from '../domain/copy';
	import { MIN_GROUP_VOTES, groupsOf } from '../domain/data';
	import type { ReportRecord } from '../domain/types';
	import { tierColorFor } from '../domain/verdict';
	import { selection } from '../state.svelte';
	import LowDataFlag from './LowDataFlag.svelte';
	import VerdictPill from './VerdictPill.svelte';

	interface Props {
		record: ReportRecord;
		onopen: () => void;
	}

	let { record, onopen }: Props = $props();

	const stats = $derived(
		record.vote
			? groupsOf(GROUPS, record.vote).map((group) => {
					// the readout shows the raw figure; only the colour and bar clamp
					const raw = group.pct;
					const pct = Math.max(0, Math.min(100, raw));
					return {
						key: group.key,
						label: group.label,
						raw,
						pct,
						color: tierColorFor(pct),
						votes: group.n,
						lowData: group.n < MIN_GROUP_VOTES
					};
				})
			: []
	);
</script>

<button
	class="icard"
	class:sel={selection.recordId === record.id}
	data-rid={record.id}
	onclick={onopen}
>
	<!-- an insight may cite a session quote, which carries no vote to judge -->
	{#if record.vote}
		<VerdictPill vote={record.vote} variant="card" />
	{/if}

	<p class="icText">“{record.text}”</p>

	<div class="icWho">
		<span class="icAv">{emojiFor(record)}</span>
		<span class="icDemo">{demoLineFor(record)}</span>
	</div>

	{#if stats.length}
		<div class="icStatsWrap">
			<div class="icStatsCap"><span class="capKey">% who agree</span>, by opinion group</div>
			<div class="icStats">
				{#each stats as stat (stat.key)}
					<div class="icStat">
						<div class="icVal" style="color:{stat.color}">
							{stat.raw}%{#if stat.lowData}<LowDataFlag votes={stat.votes} />{/if}
						</div>
						<div class="icLabel">{stat.label}</div>
						<div class="icBarTrack">
							<div class="icBarFill" style="width:{stat.pct}%;background:{stat.color}"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</button>

<style>
	/* ─── the statement card, shared by carousels, the full list and the
	   consensus page */
	.icard {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--paper);
		border: 1px solid color-mix(in srgb, var(--c) 22%, #fff);
		border-radius: 20px;
		padding: 20px 22px 22px;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}
	@media (hover: hover) {
		.icard:hover {
			transform: translateY(-2px);
			box-shadow: 0 10px 26px rgba(0, 0, 0, 0.14);
		}
	}
	.icard.sel {
		box-shadow:
			0 0 0 3px var(--c),
			0 10px 30px rgba(0, 0, 0, 0.22);
	}
	.icText {
		margin: 18px 0 20px;
		color: var(--ink);
		font-family: var(--geom);
		font-weight: 600;
		font-size: 20px;
		line-height: 1.32;
		letter-spacing: -0.01em;
	}
	.icWho {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: 2px;
		color: color-mix(in srgb, var(--c) 74%, #000);
	}
	.icWho .icAv {
		flex: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--c) 10%, #fff);
		display: grid;
		place-items: center;
		font-size: 13px;
		line-height: 1;
	}
	.icWho .icDemo {
		font-family: var(--mono);
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	/* bleeds to the card's edges, so its negative margins track the card's padding */
	.icStatsWrap {
		margin: 16px -22px -22px;
		padding: 13px 22px 15px;
		background: color-mix(in srgb, var(--c) 2.5%, #fff);
		border-radius: 0 0 19px 19px;
	}
	.icStatsCap {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--ink) 55%, transparent);
		text-align: center;
		padding-bottom: 9px;
		margin-bottom: 13px;
		border-bottom: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
	}
	.capKey {
		color: var(--agree);
	}
	.icStats {
		display: flex;
		gap: 10px;
	}
	.icStat {
		flex: 1;
		min-width: 0;
	}
	/* color is set inline per stat; it encodes the %-agree value itself
	   (0-33 red · 33-67 amber · 67-100 green), not which group it is */
	.icStat .icVal {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 19px;
		margin-bottom: 1px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.icStat .icLabel {
		font-family: var(--mono);
		font-size: 10.5px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--ink) 75%, transparent);
		margin-bottom: 6px;
	}
	.icStat .icBarTrack {
		height: 3px;
		border-radius: 2px;
		background: color-mix(in srgb, var(--ink) 10%, transparent);
	}
	.icStat .icBarFill {
		height: 100%;
		border-radius: 2px;
	}
	@media (min-width: 660px) {
		.icard {
			padding: 26px 28px 28px;
		}
		.icText {
			font-size: 26px;
			line-height: 1.28;
			margin: 22px 0 24px;
		}
		.icWho .icDemo {
			font-size: 13px;
		}
		.icWho .icAv {
			width: 26px;
			height: 26px;
			font-size: 14px;
		}
		.icStatsWrap {
			margin: 20px -28px -28px;
			padding: 15px 28px 17px;
		}
		.icStatsCap {
			font-size: 12.5px;
			padding-bottom: 10px;
			margin-bottom: 15px;
		}
		/* on desktop the per-group readout is the loudest thing on the card */
		.icStat .icVal {
			font-size: 30px;
			margin-bottom: 3px;
		}
		.icStat .icLabel {
			font-size: 13px;
			margin-bottom: 8px;
		}
	}
</style>
