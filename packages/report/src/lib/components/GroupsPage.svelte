<script lang="ts">
	import { GROUPS, GROUP_INFO } from '../domain/bundled';
	import { getOpenGroup } from '../navigation';
	import { modals } from '../state.svelte';

	const openGroup = getOpenGroup();

	// group-info.json's per-key extras (participants/colour/tagline) merged onto
	// bloom-data.json's own {key, label}, so the bubble and the modal it opens
	// always agree on a group's display name and colour.
	const groups = $derived(GROUPS.map((group) => ({ ...group, ...(GROUP_INFO[group.key] ?? {}) })));
</script>

<main class="introPage groupsPage">
	<div class="masthead">
		<h1>Participants represented a range of perspectives on AI…</h1>
		<p>
			We found three opinion groups based on our analysis of people's voting patterns. Click each
			group to learn about what distinguished them from the rest.
		</p>
	</div>

	<div class="groupBubbles">
		{#each groups as group (group.key)}
			<button
				class="gbubble"
				class:sel={modals.group?.key === group.key}
				type="button"
				style="--c:{group.color || 'var(--home)'}"
				aria-label="{group.label}: {group.participants || 0} people, see defining statements"
				onclick={() => openGroup(group.key)}
			>
				<div class="gName">{group.label}</div>
				<div class="gCount">{group.participants || 0} people</div>
				{#if group.tagline}
					<p class="gTagline">{group.tagline}</p>
				{/if}
			</button>
		{/each}
	</div>
</main>

<style>
	.groupsPage {
		color: var(--ink);
	}
	.groupsPage .masthead h1 {
		color: var(--theme-blue);
	}
	.groupsPage .masthead p {
		font-family: var(--geom);
		font-weight: 400;
		color: var(--ink);
	}

	.groupBubbles {
		padding: 14px 22px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* the gradient is only a sheen over the group's own colour, so the card
	   still reads as that group rather than a different colour */
	.gbubble {
		display: block;
		width: 100%;
		text-align: left;
		color: #fff;
		background: linear-gradient(180deg, color-mix(in srgb, var(--c) 82%, #000) 0%, var(--c) 100%);
		border-radius: 22px;
		padding: 22px 24px 24px;
		box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
		/* backwards, not both: a fill that outlives the animation would pin
		   transform and swallow the hover lift. tallyIn is declared in app.css,
		   since the theme grid's tally cells use it too */
		animation: tallyIn 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) backwards;
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease;
	}
	@media (hover: hover) {
		.gbubble:hover {
			transform: translateY(-2px);
			box-shadow: 0 14px 32px rgba(0, 0, 0, 0.3);
		}
	}
	.gbubble:active {
		transform: scale(0.98);
	}
	.gbubble.sel {
		box-shadow:
			0 0 0 3px rgba(255, 255, 255, 0.65),
			0 14px 32px rgba(0, 0, 0, 0.3);
	}

	.gName {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 26px;
	}
	.gCount {
		display: inline-block;
		margin-top: 9px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgba(255, 255, 255, 0.22);
		padding: 5px 12px;
		border-radius: 999px;
	}
	.gTagline {
		color: rgba(255, 255, 255, 0.92);
		font-size: 16.5px;
		line-height: 1.45;
		margin: 14px 0 0;
	}

	@media (min-width: 660px) {
		.groupBubbles {
			padding: 20px 22px 30px;
			gap: 16px;
		}
		.gName {
			font-size: 30px;
		}
		.gCount {
			font-size: 14px;
		}
		.gTagline {
			font-size: 19px;
		}
	}
</style>
