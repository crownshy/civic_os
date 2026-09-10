<script lang="ts">
	import { CONSENSUS_RECORDS } from '../domain/bundled';
	import { getOpenStatement } from '../navigation';
	import StatementCard from './StatementCard.svelte';

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
	<div class="cards">
		{#each CONSENSUS_RECORDS as record, index (record.id)}
			<StatementCard {record} onopen={() => openStatement(CONSENSUS_RECORDS, index)} />
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
	.cards {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 6px 22px 46px;
	}
</style>
