<script lang="ts">
	import { GROUPS, GROUP_INFO } from '../domain/bundled';
	import { groupTag } from '../domain/data';
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
		<div class="eyebrow label">Bloom Project · COCAP · Central Oregon</div>
		<h1>We identified a few different kinds of people…</h1>
		<p>Click each to learn more about what distinguished them from the rest.</p>
	</div>

	<div class="groupBubbles">
		{#each groups as group (group.key)}
			<button
				class="gbubble"
				class:sel={modals.group === group.key}
				type="button"
				data-key={group.key}
				style="--c:{group.color || 'var(--home)'}"
				aria-label="{groupTag(group)}: {group.participants || 0} people — see defining statements"
				onclick={() => openGroup(group.key)}
			>
				<div class="gName">{groupTag(group)}</div>
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
		background: var(--paper);
		color: var(--ink);
	}
	.groupsPage .masthead .eyebrow {
		color: color-mix(in srgb, var(--ink) 55%, transparent);
	}
	/* Geom + solid ink per design call; the shared .masthead p rule (light,
	   body-font) is right for a dark background but reads as unreadable here,
	   the one intro page that isn't dark */
	.groupsPage .masthead p {
		font-family: var(--geom);
		font-weight: 500;
		color: var(--ink);
	}

	.groupBubbles {
		padding: 14px 22px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* a plain bordered card per group; the outline is the only thing carrying
	   the group's color; everything else on the card is black/gray so the
	   name (the one colored line) is what actually draws the eye */
	.gbubble {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: 1.5px solid color-mix(in srgb, var(--c, var(--home)) 55%, #fff);
		border-radius: 16px;
		padding: 16px 18px;
		cursor: pointer;
		/* tallyIn is declared globally in app.css; the theme grid's tally cells
		   use it too, and Svelte only renames keyframes a component declares */
		animation: tallyIn 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both;
		transition:
			background 0.2s ease,
			transform 0.15s ease;
	}
	@media (hover: hover) {
		.gbubble:hover {
			background: color-mix(in srgb, var(--c, var(--home)) 6%, transparent);
		}
	}
	.gbubble:active {
		transform: scale(0.98);
	}
	.gbubble.sel {
		background: color-mix(in srgb, var(--c, var(--home)) 10%, transparent);
	}

	.gName {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 21px;
		color: var(--c, var(--home));
	}
	.gCount {
		font-family: var(--mono);
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(0, 0, 0, 0.5);
		margin-top: 4px;
	}
	.gTagline {
		font-style: italic;
		color: rgba(0, 0, 0, 0.65);
		font-size: 17px;
		line-height: 1.4;
		margin: 10px 0 0;
	}

	@media (min-width: 660px) {
		.groupBubbles {
			padding: 20px 22px 30px;
			gap: 16px;
		}
		.gName {
			font-size: 24px;
		}
		.gCount {
			font-size: 14px;
		}
		.gTagline {
			font-size: 19px;
		}
	}
</style>
