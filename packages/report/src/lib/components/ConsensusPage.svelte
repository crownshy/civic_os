<script lang="ts">
	import { REPORT_CONFIG } from '../data/report-config';
	import { CONSENSUS_RECORDS } from '../domain/bundled';
	import { getOpenStatement } from '../navigation';
	import StatementCard from './StatementCard.svelte';

	const openStatement = getOpenStatement();
	const copy = REPORT_CONFIG.pages.consensus;
</script>

<main class="introPage consensusPage">
	<div class="masthead">
		<h1>{copy.heading}</h1>
		<p>{copy.body}</p>
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
