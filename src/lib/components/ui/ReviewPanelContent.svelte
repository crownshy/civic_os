<script lang="ts">
	import { onMount } from 'svelte';
	import { session } from '$lib/services/session.svelte';
	import { HEYFORM_EMBED_URL, isHeyformSubmitMessage } from '$lib/config/heyform';

	interface Props {
		umamiSubmitEvent?: string;
		/** Fired when Heyform postMessages a submission. */
		onComplete?: () => void;
	}

	let { umamiSubmitEvent, onComplete }: Props = $props();

	onMount(() => {
		function handleMessage(event: MessageEvent) {
			if (isHeyformSubmitMessage(event.data)) {
				session.markEndCtaReviewCompleted();
				onComplete?.();
			}
		}
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	});
</script>

<div class="-mx-7 -mb-2 h-[420px] md:mx-0 md:h-[480px]">
	<iframe
		src={HEYFORM_EMBED_URL}
		title="Leave a review"
		class="size-full border-0"
		data-umami-event={umamiSubmitEvent}
	></iframe>
</div>
