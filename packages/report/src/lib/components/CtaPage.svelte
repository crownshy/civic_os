<script lang="ts">
	import mountains from '../assets/sisters_bg.webp';
	import { getNavigate, getOpenShare } from '../navigation';

	const navigate = getNavigate();
	const openShare = getOpenShare();
</script>

<main class="introPage ctaPage">
	<img class="mountains" src={mountains} alt="" />
	<div class="masthead">
		<h1>Now is the time to act for the future of our communities.</h1>
		<p>
			We're organizing a Civic Assembly in December, where 30 residents will develop policies to
			make sure the public has a meaningful role in the government's AI-related decisions.
			<span class="highlight">You are invited to participate.</span> Register your interest below.
		</p>
	</div>
	<div class="actions">
		<a
			class="primary"
			href="https://bloomproject.typeform.com/to/C1N3LI7g?utm_source=report"
			target="_blank"
			rel="noopener">Register here</a
		>
		<button class="secondary" type="button" onclick={openShare}>
			<svg viewBox="0 0 20 20" aria-hidden="true"
				><path d="M2.5 10.3L17 2.7l-4.3 14.7-2.9-6-7.3-1.1z" /></svg
			>
			Share this with a friend
		</button>
		<button class="secondary" type="button" onclick={() => navigate('themes')}>
			<svg viewBox="0 0 20 20" aria-hidden="true"
				><rect x="2" y="11" width="4" height="7" rx="1" /><rect
					x="8"
					y="6"
					width="4"
					height="12"
					rx="1"
				/><rect x="14" y="2" width="4" height="16" rx="1" /></svg
			>
			Explore the Data
		</button>
	</div>
</main>

<style>
	/* exactly the space between the two bars, so the buttons sit just above
	   the bottom one without the page scrolling */
	.ctaPage {
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--topbar-h) - var(--bar-h));
		min-height: calc(100dvh - var(--topbar-h) - var(--bar-h));
		padding-bottom: 0;
		color: #fff;
	}
	/* a luminosity blend against the page's blue is what turns the photo into
	   a duotone the copy stays legible over */
	.mountains {
		position: absolute;
		left: 50%;
		bottom: 0;
		transform: translate(-50%, 30%);
		z-index: 0;
		width: 100%;
		height: auto;
		filter: brightness(0.55) contrast(1.15) saturate(1.4);
		mix-blend-mode: luminosity;
		pointer-events: none;
	}
	.masthead,
	.actions {
		position: relative;
		z-index: 1;
	}
	.masthead {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
	}
	.masthead h1 {
		max-width: 15em;
		margin-inline: auto;
	}
	.masthead p {
		color: #fff;
		max-width: 30em;
		margin-inline: auto;
	}
	.highlight {
		color: #ffd85a;
		font-weight: 600;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 22px 28px;
	}
	.primary,
	.secondary {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 19px;
		border-radius: 999px;
		width: 100%;
	}
	.primary {
		display: block;
		text-align: center;
		text-decoration: none;
		background: #e25d3b;
		color: #fff;
		padding: 19px 26px;
		box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
		transition: transform 0.15s ease;
	}
	.primary:active {
		transform: scale(0.97);
	}
	.secondary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		background: rgba(9, 20, 52, 0.82);
		color: #fff;
		padding: 17px 22px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
		backdrop-filter: blur(6px);
		transition: background 0.2s ease;
	}
	.secondary svg {
		width: 18px;
		height: 18px;
		fill: currentColor;
		flex: none;
	}
	@media (hover: hover) {
		.primary:hover {
			transform: translateY(-1px);
		}
		.secondary:hover {
			background: rgba(9, 20, 52, 0.95);
		}
	}
	@media (max-width: 659px) {
		.mountains {
			width: 118%;
			transform: translate(-50%, 16%);
		}
	}
	@media (min-width: 660px) {
		.ctaPage {
			justify-content: center;
		}
		.masthead {
			flex: none;
		}
		.masthead p {
			font-size: 25px;
			line-height: 1.45;
		}
		.actions {
			margin-top: 52px;
		}
		/* fixed so it spans the whole window, not just the column */
		.mountains {
			position: fixed;
			width: min(100%, 1400px);
		}
		.primary,
		.secondary {
			font-size: 21px;
			max-width: 440px;
			margin-inline: auto;
		}
	}
</style>
