<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		/** names the dialog for assistive tech; not shown */
		label: string;
		/** the theme/group accent this dialog inherits */
		accent?: string;
		onclose: () => void;
		/** ← / → while the dialog is open, if it pages through anything */
		onpage?: (delta: number) => void;
		/** extra class on the dialog, so a modal can key its own rules off it */
		variant?: string;
		header: Snippet;
		body: Snippet;
		footer?: Snippet;
	}

	let { open, label, accent, onclose, onpage, variant, header, body, footer }: Props = $props();

	/**
	 * Built on the bits-ui primitive rather than a styled dialog wrapper: the
	 * report supplies all of its own chrome, and only needs the focus trap,
	 * Escape handling and aria wiring underneath it.
	 *
	 * preventScroll is off deliberately. bits-ui locks scrolling with
	 * `body { overflow: hidden }`, which makes the body the sticky containing
	 * block and stops a theme page's .l2nav sticking, the exact hazard
	 * app.css's own comment warns about.
	 */
	function onkeydown(event: KeyboardEvent) {
		if (!onpage) return;
		if (event.key === 'ArrowRight') {
			onpage(1);
			event.preventDefault();
		}
		if (event.key === 'ArrowLeft') {
			onpage(-1);
			event.preventDefault();
		}
	}
</script>

<Dialog.Root bind:open={() => open, (v) => !v && onclose()}>
	<Dialog.Portal>
		<Dialog.Overlay class="scrim" />
		<Dialog.Content
			preventScroll={false}
			class="reportDialog {variant ?? ''}"
			style={accent ? `--c:${accent}` : undefined}
			aria-label={label}
			{onkeydown}
		>
			<Dialog.Title class="sr-only">{label}</Dialog.Title>
			<div class="card">
				<div class="cardtop">
					{@render header()}
					<Dialog.Close class="closeb" aria-label="Close">
						<svg viewBox="0 0 16 16" aria-hidden="true"
							><path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke-linecap="round" /></svg
						>
					</Dialog.Close>
				</div>
				{@render body()}
				{#if footer}
					{@render footer()}
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* the dialog element itself is only a positioning shell; .card and .scrim
	   are still global in app.css while the three modals share them */
	:global(.reportDialog) {
		position: fixed;
		inset: 0;
		z-index: 60;
	}
	:global(.reportDialog .sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	/*
	 * fixed, not absolute: bits-ui portals the overlay to <body>, so absolute
	 * would resolve against the document and leave most of the page undimmed.
	 */
	:global(.scrim) {
		position: fixed;
		inset: 0;
		/* above the page bar (50) and a theme page's sticky nav (30), which
		   would otherwise paint straight through it */
		z-index: 60;
		background: rgba(10, 10, 12, 0.42);
		animation: fadeIn 0.3s ease both;
	}
	/*
	 * The modal chrome. It is :global because the pieces are split between this
	 * shell (card, cardtop, close) and the three modals that fill it (cardbody,
	 * quotewrap, meta, the per-modal blocks). One stylesheet, one owner.
	 */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	:global(.card) {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: calc(100% - 28px);
		max-width: 572px;
		height: min(76vh, 720px);
		background: var(--paper);
		color: var(--c);
		border-radius: 24px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 22px 60px rgba(0, 0, 0, 0.34);
		animation: cardIn 0.34s cubic-bezier(0.2, 0.85, 0.3, 1) both;
	}
	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translate(-50%, -46%) scale(0.985);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}
	:global(.cardtop) {
		display: flex;
		align-items: center;
		padding: 13px 16px 13px 14px;
		flex: none;
		background: var(--paper);
		border-bottom: 1px solid color-mix(in srgb, var(--c) 16%, #fff);
		border-radius: 24px 24px 0 0;
	}
	:global(.closeb) {
		flex: none;
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		color: var(--c);
		margin: 0 -2px 0 auto;
		border-radius: 50%;
		transition: background 0.2s ease;
	}
	:global(.closeb:hover) {
		background: rgba(0, 0, 0, 0.06);
	}
	:global(.closeb svg) {
		width: 15px;
		height: 15px;
		stroke: currentColor;
		stroke-width: 2.2;
		fill: none;
	}
	:global(.cardbody) {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		overscroll-behavior: contain;
	}
	:global(.quotewrap) {
		padding: 26px 22px 26px;
	}
	:global(.quotewrap blockquote) {
		margin: 0;
		font-family: var(--geom);
		font-weight: 600;
		font-size: var(--qs, 26px);
		line-height: 1.16;
		letter-spacing: -0.016em;
		color: var(--c);
		text-wrap: pretty;
	}
	:global(.meta) {
		border-top: 1px solid color-mix(in srgb, var(--c) 18%, #fff);
		padding: 18px 22px 24px;
	}
	:global(.meta h4) {
		font-family: var(--mono);
		font-weight: 500;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--c) 55%, #fff);
		margin: 0 0 7px;
	}
	:global(.meta .src) {
		font-size: 14px;
		line-height: 1.4;
		margin: 0 0 16px;
		font-weight: 500;
	}
	:global(.meta .src small) {
		display: block;
		font-weight: 400;
		font-size: 12.5px;
		margin-top: 2px;
	}
	:global(.meta section + section) {
		margin-top: 16px;
	}
	:global(.grow) {
		margin-bottom: 11px;
	}
	:global(.grow:last-child) {
		margin-bottom: 2px;
	}
	:global(.grow .top) {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 10px;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--c) 62%, #fff);
		margin-bottom: 5px;
	}
	:global(.grow .top b) {
		font-weight: 500;
		color: var(--c);
	}
	:global(.bar) {
		display: flex;
		gap: 2px;
		height: 3px;
		border-radius: 2px;
		overflow: hidden;
	}
	:global(.bar i) {
		display: block;
		height: 100%;
		border-radius: 2px;
		transition: flex-grow 0.4s ease;
	}
	:global(.bar .d) {
		background: var(--disagree);
	}
	:global(.bar .p) {
		background: var(--pass);
	}
	:global(.bar .a) {
		background: var(--agree);
	}
	:global(.barkey) {
		display: flex;
		gap: 13px;
		margin-top: 9px;
		font-family: var(--mono);
		font-size: 9px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--c) 48%, #fff);
	}
	:global(.barkey span) {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	:global(.barkey i) {
		width: 9px;
		height: 3px;
		border-radius: 2px;
		flex: none;
	}
	:global(.tags) {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	:global(.tags i) {
		font-style: normal;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		padding: 4px 9px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--c) 11%, #fff);
		color: var(--c);
	}
	:global(.cardfoot) {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 11px 16px;
		border-top: 1px solid color-mix(in srgb, var(--c) 20%, #fff);
		background: var(--paper);
	}
	:global(.cardfoot button) {
		width: 44px;
		height: 36px;
		display: grid;
		place-items: center;
		color: var(--c);
		border-radius: 10px;
		transition:
			background 0.18s ease,
			opacity 0.18s ease;
	}
	:global(.cardfoot button:hover) {
		background: color-mix(in srgb, var(--c) 9%, #fff);
	}
	:global(.cardfoot button[disabled]) {
		opacity: 0.24;
		cursor: default;
		background: none;
	}
	:global(.cardfoot svg) {
		width: 26px;
		height: 14px;
		stroke: currentColor;
		stroke-width: 1.9;
		fill: none;
	}
	:global(.cardfoot .pos) {
		font-family: var(--mono);
		font-size: 13px;
		letter-spacing: 0.1em;
		color: var(--c);
	}
	:global(.cardfoot .pos em) {
		font-style: normal;
		opacity: 0.45;
	}
	:global(.gcHead) {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	:global(.gdDesc) {
		padding: 28px 22px 26px;
	}
	:global(.gdText) {
		margin: 0;
		color: var(--ink);
		font-family: var(--geom);
		font-weight: 600;
		font-size: 22px;
		line-height: 1.34;
		letter-spacing: -0.01em;
	}
	:global(.ddTitle) {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 32px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(.ddTabs) {
		display: flex;
		flex-wrap: nowrap;
		gap: 6px;
		padding: 0 16px 14px;
		flex: none;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		border-bottom: 1px solid color-mix(in srgb, var(--c) 16%, #fff);
	}
	:global(.ddTabs button) {
		flex: none;
		font-size: 10.5px;
		letter-spacing: 0.08em;
		padding: 7px 12px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--home) 10%, #fff);
		color: var(--home);
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}
	/* aria-selected, not aria-pressed: role=tab does not support pressed, and
	   the attribute the tab list actually sets is what has to be styled */
	:global(.ddTabs button[aria-selected='true']) {
		background: var(--home);
		color: #fff;
		font-weight: 500;
	}
	:global(.ddIntro) {
		margin: 0;
		padding: 20px 22px 4px;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink);
	}
	:global(.ddIntro b) {
		font-weight: 700;
		color: var(--agree);
	}
	:global(.ddList) {
		padding: 6px 0 0;
	}
	:global(.ddRow) {
		position: relative;
		isolation: isolate;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 22px;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		font-size: 16px;
		overflow: hidden;
	}
	:global(.ddRow:last-child) {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}
	:global(.ddRow::before) {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		width: var(--pct);
		background: color-mix(in srgb, var(--rc) 10%, #fff);
	}
	:global(.ddSwatch) {
		width: 11px;
		height: 11px;
		border-radius: 3px;
		flex: none;
		background: var(--rc);
	}
	:global(.ddLabel) {
		flex: 1 1 auto;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink);
	}
	:global(.ddPct) {
		font-family: var(--mono);
		font-weight: 600;
		color: var(--ink);
		flex: none;
	}
</style>
