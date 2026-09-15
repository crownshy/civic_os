<script lang="ts">
	import { getOpenStatement, getReport } from '../navigation';
	import StatementCard from './StatementCard.svelte';

	const openStatement = getOpenStatement();
	const report = getReport();
	const copy = report.config.pages.consensus;
	const records = report.consensusRecords;
</script>

<main class="introPage consensusPage">
	<div class="masthead">
		<h1>{copy.heading}</h1>
		<p>{copy.body}</p>
	</div>
	<div class="cards">
		{#each records as record, index (record.id)}
			<StatementCard {record} onopen={() => openStatement(records, index)} />
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
