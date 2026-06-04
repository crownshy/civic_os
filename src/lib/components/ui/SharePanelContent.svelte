<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Mail, MessageSquare, Link as LinkIcon, Check } from 'lucide-svelte';
	import { session } from '$lib/services/session.svelte';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		region: RegionConfig;
		umamiTextEvent?: string;
		umamiEmailEvent?: string;
		umamiLinkEvent?: string;
		/** Fired after the user picks any share channel. */
		onComplete?: () => void;
	}

	let { region, umamiTextEvent, umamiEmailEvent, umamiLinkEvent, onComplete }: Props = $props();

	const subject = $derived(`Have your say about AI in ${region.stateName}`);
	const body = $derived(
		`I just shared what I think about how ${region.demonym} should approach AI. Add your voice: ${region.shareUrl}`
	);

	let linkCopied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	function markAndComplete() {
		session.markEndCtaShareCompleted();
		onComplete?.();
	}

	function shareViaText() {
		window.location.href = `sms:?&body=${encodeURIComponent(body)}`;
		markAndComplete();
	}

	function shareViaEmail() {
		window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		markAndComplete();
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(region.shareUrl);
		} catch {
			/* clipboard may be blocked; intent was clear */
		}
		linkCopied = true;
		// Mark complete + signal caller; let the "Copied!" affordance linger briefly first.
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			linkCopied = false;
			markAndComplete();
		}, 800);
	}

	onDestroy(() => clearTimeout(copyTimer));
</script>

<div class="flex justify-around pt-2">
	<button
		type="button"
		data-umami-event={umamiTextEvent}
		onclick={shareViaText}
		class="flex flex-col items-center gap-2"
	>
		<span
			class="flex size-16 items-center justify-center rounded-full bg-secondary/10 transition-colors hover:bg-secondary/20"
		>
			<MessageSquare class="size-7 text-secondary" />
		</span>
		<span class="font-mono text-sm font-medium text-secondary/70">TEXT</span>
	</button>

	<button
		type="button"
		data-umami-event={umamiEmailEvent}
		onclick={shareViaEmail}
		class="flex flex-col items-center gap-2"
	>
		<span
			class="flex size-16 items-center justify-center rounded-full bg-secondary/10 transition-colors hover:bg-secondary/20"
		>
			<Mail class="size-7 text-secondary" />
		</span>
		<span class="font-mono text-sm font-medium text-secondary/70">EMAIL</span>
	</button>

	<button
		type="button"
		data-umami-event={umamiLinkEvent}
		onclick={copyLink}
		class="flex flex-col items-center gap-2"
	>
		<span
			class="flex size-16 items-center justify-center rounded-full bg-secondary/10 transition-colors hover:bg-secondary/20"
		>
			{#if linkCopied}
				<Check class="size-7 text-primary" />
			{:else}
				<LinkIcon class="size-7 text-secondary" />
			{/if}
		</span>
		<span class="font-mono text-sm font-medium text-secondary/70">
			{linkCopied ? 'COPIED!' : 'LINK'}
		</span>
	</button>
</div>
