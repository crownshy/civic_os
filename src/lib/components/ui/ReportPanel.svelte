<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { X } from 'lucide-svelte';
	import type { RegionConfig } from '$lib/config/regions';

	// TODO: Swap REPORT_FORM_ID for the real HeyForm form ID once the report form is built.
	const REPORT_FORM_ID = 'REPLACE_WITH_FORM_ID';

	interface Props {
		open: boolean;
		statementId: number | string;
		statementText: string;
		region: RegionConfig;
	}

	let { open = $bindable(false), statementId, statementText, region }: Props = $props();

	let iframeLoaded = $state(false);

	// statement_id (P0) + statement_text (P1) ride along as HeyForm hidden fields,
	// matching the event_id pattern used by the conversation signup form.
	const formUrl = $derived(
		`https://forms.bloomproject.us/form/${REPORT_FORM_ID}` +
			`?statement_id=${encodeURIComponent(String(statementId))}` +
			`&statement_text=${encodeURIComponent(statementText)}` +
			`&region=${encodeURIComponent(region.slug)}` +
			`&hideAfterSubmit=true&autoClose=1`
	);

	function close() {
		open = false;
		iframeLoaded = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && open) close();
	}}
/>

{#if open}
	<div class="absolute inset-0 z-50">
		<button
			type="button"
			aria-label="Close report panel"
			class="absolute inset-0 cursor-default bg-black/40"
			onclick={close}
			transition:fade={{ duration: 200 }}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			aria-label="Report this statement"
			class="absolute inset-x-0 bottom-0 flex h-[90%] flex-col overflow-hidden rounded-t-[30px] bg-card"
			transition:fly={{ y: 600, duration: 350, easing: cubicOut }}
		>
			<div class="flex shrink-0 items-center justify-between px-6 pt-6 pb-3">
				<h2 class="font-sans text-2xl font-bold text-card-foreground">Report this statement</h2>
				<button
					type="button"
					onclick={close}
					aria-label="Close"
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-card-foreground"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="relative flex-1">
				{#if !iframeLoaded}
					<div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
						<div
							class="h-10 w-10 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground"
						></div>
						<span class="font-mono text-sm uppercase text-foreground/60">Loading form...</span>
					</div>
				{/if}
				<iframe
					title="Report statement form"
					src={formUrl}
					width="100%"
					height="100%"
					frameborder="0"
					style="background: transparent;"
					class="transition-opacity duration-300 {iframeLoaded ? 'opacity-100' : 'opacity-0'}"
					onload={() => (iframeLoaded = true)}
				></iframe>
			</div>
		</div>
	</div>
{/if}
