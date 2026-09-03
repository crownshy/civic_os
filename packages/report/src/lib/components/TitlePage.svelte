<script lang="ts">
	import { getNavigate } from '../navigation';

	const navigate = getNavigate();
</script>

<main class="introPage titlePage">
	<div class="masthead">
		<div class="eyebrow label">Central Oregon &amp; AI</div>
		<h1>What did Central Oregonians have to say about AI?</h1>
		<p>
			Along with other organizations, the Central Oregon Civic Action Project (COCAP) talked to 400+
			real people to hear what they thought should be done about AI.
		</p>
		<button class="diveIn" type="button" onclick={() => navigate('demogs')}>Dive in</button>
	</div>
</main>

<style>
	/*
	 * The title page centres its only child on both axes; every other intro
	 * page keeps normal top-down flow. Zeroing .introPage's shared bottom
	 * padding (reserved elsewhere for #demogReset and breathing room) is what
	 * makes that centring true rather than skewed upward by space this page has
	 * no use for.
	 */
	.titlePage {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-bottom: 0;
		background: var(--home);
		color: #fff;
	}

	/*
	 * h1 and p carry a max-width for line length, which narrows their own box
	 * but does not centre it; text-align only centres text *within* a box. So
	 * without margin:auto they would sit flush-left inside the wider, truly
	 * centred masthead while still reading centred internally.
	 */
	.titlePage .masthead {
		text-align: center;
	}
	.titlePage .masthead h1 {
		margin-left: auto;
		margin-right: auto;
	}
	.titlePage .masthead p {
		color: #fff;
		font-size: 19px;
		margin-left: auto;
		margin-right: auto;
	}

	.diveIn {
		display: inline-block;
		margin-top: 18px;
		background: #fff;
		color: var(--home);
		padding: 12px 26px;
		border-radius: 999px;
		font-family: var(--geom);
		font-weight: 600;
		font-size: 19px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
		transition: transform 0.15s ease;
	}
	.diveIn:active {
		transform: scale(0.96);
	}

	@media (min-width: 660px) {
		.titlePage .masthead p {
			font-size: 21px;
		}
		.diveIn {
			font-size: 21px;
		}
	}
</style>
