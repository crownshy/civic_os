<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { modals } from '../state.svelte';
	import ReportDialog from './ReportDialog.svelte';

	const url = $derived(page.url.origin + resolve('/[slug]', { slug: page.params.slug ?? '' }));

	let field = $state<HTMLInputElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		const share = modals.share;
		if (!share) return;
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			// the Clipboard API is unavailable over plain http, so fall back to
			// the deprecated command on the selected field
			field?.select();
			document.execCommand('copy');
		}
		share.copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (share.copied = false), 1800);
	}

	function close() {
		clearTimeout(timer);
		modals.share = null;
	}
</script>

<ReportDialog
	open={modals.share !== null}
	label="Share this report"
	variant="shareDialog"
	onclose={close}
>
	{#snippet body()}
		<h2>Share this with a friend</h2>
		<p>Copy the link below and pass it along.</p>
		<input bind:this={field} class="url" type="text" value={url} readonly aria-label="Report URL" />
		<button class="copy" type="button" onclick={copy}>
			{modals.share?.copied ? 'Copied!' : 'Copy Link'}
		</button>
	{/snippet}
</ReportDialog>

<style>
	/* a small dark card rather than the full modal shell: there is nothing to
	   page through, just a link and a button */
	:global(.shareDialog .card) {
		height: auto;
		width: calc(100% - 44px);
		max-width: 420px;
		background: var(--home);
		color: #fff;
		border-radius: 22px;
		padding: 26px 24px 24px;
		box-shadow: 0 22px 60px rgba(0, 0, 0, 0.4);
	}
	:global(.shareDialog .cardtop) {
		position: absolute;
		top: 16px;
		right: 16px;
		padding: 0;
		background: none;
		border: 0;
		border-radius: 0;
	}
	:global(.shareDialog .closeb) {
		color: #fff;
		margin: 0;
	}
	:global(.shareDialog .closeb:hover) {
		background: rgba(255, 255, 255, 0.14);
	}
	h2 {
		font-family: var(--geom);
		font-weight: 700;
		font-size: 22px;
		margin: 0 0 6px;
		padding-right: 30px;
	}
	p {
		color: rgba(255, 255, 255, 0.7);
		font-size: 14.5px;
		line-height: 1.4;
		margin: 0 0 18px;
	}
	.url {
		display: block;
		width: 100%;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.22);
		border-radius: 12px;
		padding: 13px 14px;
		font-family: var(--mono);
		font-size: 13.5px;
		margin-bottom: 14px;
	}
	.url:focus {
		outline: 2px solid rgba(255, 255, 255, 0.6);
		outline-offset: 1px;
	}
	.copy {
		display: block;
		width: 100%;
		text-align: center;
		background: var(--gold);
		color: var(--home);
		padding: 14px 22px;
		border-radius: 999px;
		font-family: var(--geom);
		font-weight: 700;
		font-size: 16px;
		transition: transform 0.15s ease;
	}
	.copy:active {
		transform: scale(0.97);
	}
	@media (hover: hover) {
		.copy:hover {
			transform: translateY(-1px);
		}
	}
</style>
