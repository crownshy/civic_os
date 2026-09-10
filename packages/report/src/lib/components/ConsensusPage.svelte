<script lang="ts">
	import { CONSENSUS_RECORDS } from '../domain/bundled';
	import { getOpenStatement } from '../navigation';
	import ConsensusCard from './ConsensusCard.svelte';

	const openStatement = getOpenStatement();
</script>

<main class="introPage consensusPage">
	<div class="masthead">
		<h1>…but we found a lot of common ground.</h1>
		<p>
			Despite their differences, almost everyone agreed on the importance of transparency and
			community involvement in AI-related decision-making.
		</p>
	</div>
	<div class="lane listView">
		{#each CONSENSUS_RECORDS as record, index (record.id)}
			<ConsensusCard {record} onopen={() => openStatement(CONSENSUS_RECORDS, index)} />
		{/each}
	</div>
</main>

<style>
	.consensusPage {
		color: #fff;
	}
	.consensusPage .masthead p {
		color: #fff;
	}

	/* ─── L0: CONSENSUS card stack ───────────────────────────────────── */
	/* The List tab's card styles, kept when the tab system was removed because
	   the Consensus page is now their only consumer.
	   Deliberately distinct from the .icard used on theme pages: the point of
	   this page is the 0-100% axis with one lettered square per opinion group. */
	.lane {
		position: relative;
		overflow: visible;
		display: flow-root;
	}
	.lane.listView {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 6px 22px 46px;
	}
</style>
