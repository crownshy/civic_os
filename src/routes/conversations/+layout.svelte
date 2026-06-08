<script lang="ts">
	import { onNavigate } from '$app/navigation';

	type DocumentWithStartViewTransition = Document & {
		startViewTransition?: (callback: () => Promise<void> | void) => unknown;
	};

	let { children } = $props();

	onNavigate((navigation) => {
		const transitionDocument = document as DocumentWithStartViewTransition;

		if (!transitionDocument.startViewTransition) return;

		return new Promise((resolve) => {
			transitionDocument.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
	@keyframes fade-out {
		to {
			opacity: 0;
			transform: translateY(-4px);
		}
	}
	@keyframes slide-from-right {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
	}
	@keyframes slide-to-left {
		to {
			opacity: 0;
			transform: translateX(-30px);
		}
	}

	:global(::view-transition-old(root)) {
		animation: 250ms cubic-bezier(0.4, 0, 0.2, 1) both fade-out;
	}
	:global(::view-transition-new(root)) {
		animation: 350ms cubic-bezier(0, 0, 0.2, 1) both fade-in;
	}

	:global(::view-transition-old(detail-hero)) {
		animation: 200ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
	}
	:global(::view-transition-new(detail-hero)) {
		animation: 350ms cubic-bezier(0, 0, 0.2, 1) both slide-from-right;
	}
</style>
