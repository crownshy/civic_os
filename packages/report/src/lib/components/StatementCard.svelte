<script lang="ts">
	import { GROUPS } from '../domain/bundled';
	import { demoLineFor, emojiFor } from '../domain/copy';
	import { groupTag, groupsOf } from '../domain/data';
	import type { ReportRecord } from '../domain/types';
	import { tierColorFor } from '../domain/verdict';
	import { selection } from '../state.svelte';
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
					const raw = group.pct ?? 0;
					const pct = Math.max(0, Math.min(100, raw));
					return { key: group.key, label: groupTag(group), raw, pct, color: tierColorFor(pct) };
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
		<VerdictPill vote={record.vote} />
	{/if}

	<p class="icText">“{record.text}”</p>

	<div class="icWho">
		<span class="icAv">{emojiFor(record)}</span>
		<span class="icDemo">{demoLineFor(record)}</span>
	</div>

	<div class="icStats">
		{#each stats as stat (stat.key)}
			<div class="icStat">
				<div class="icVal" style="color:{stat.color}">{stat.raw}%</div>
				<div class="icLabel">{stat.label}</div>
				<div class="icBarTrack">
					<div class="icBarFill" style="width:{stat.pct}%;background:{stat.color}"></div>
				</div>
			</div>
		{/each}
	</div>
</button>

<style>
	/* ─── the new statement card, shared by carousels and the full list */
	.icard {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--paper);
		border: 1px solid color-mix(in srgb, var(--c) 22%, #fff);
		border-radius: 20px;
		padding: 16px 18px 18px;
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
		margin: 14px 0 16px;
		color: var(--ink);
		font-family: var(--geom);
		font-weight: 600;
		font-size: 19px;
		line-height: 1.32;
		letter-spacing: -0.01em;
	}
	.icWho {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: 2px;
		color: color-mix(in srgb, var(--c) 62%, #000);
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
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.icStats {
		display: flex;
		gap: 10px;
		margin: 16px -18px -18px;
		padding: 12px 18px 14px;
		background: color-mix(in srgb, var(--c) 6%, #fff);
		border-radius: 0 0 19px 19px;
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
	}
	.icStat .icLabel {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--ink) 55%, transparent);
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
</style>
