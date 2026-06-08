<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Mail, Check } from 'lucide-svelte';
	import { session } from '$lib/services/session.svelte';
	import Button from './Button.svelte';
	import { Input } from './input';

	interface Props {
		umamiSubmitEvent?: string;
		/** Fired after a successful email submission. Caller typically closes the panel or advances. */
		onComplete?: () => void;
	}

	let { umamiSubmitEvent, onComplete }: Props = $props();

	let email = $state('');
	let submitting = $state(false);
	let justSubmitted = $state(false);
	let error = $state('');
	let completeTimer: ReturnType<typeof setTimeout> | undefined;

	// Show the "already on the list" confirmation only when the panel was opened *before*
	// the user provided their email this session — not as a momentary flash right after submit.
	// `justSubmitted` is our own success-beat state; the parent will close us shortly after.
	const alreadyDone = $derived(session.emailProvided && !justSubmitted);

	function isValidEmail(value: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	async function handleSubmit() {
		error = '';
		const trimmed = email.trim();
		if (!trimmed) {
			error = 'Please enter an email address';
			return;
		}
		if (!isValidEmail(trimmed)) {
			error = 'Please enter a valid email address';
			return;
		}
		submitting = true;
		await session.registerEmail(trimmed);
		session.emailProvided = true;
		submitting = false;
		// Brief success beat so the panel doesn't slam shut on the user.
		justSubmitted = true;
		clearTimeout(completeTimer);
		completeTimer = setTimeout(() => onComplete?.(), 600);
	}

	onDestroy(() => clearTimeout(completeTimer));
</script>

{#if justSubmitted}
	<div in:fade={{ duration: 200 }} class="flex flex-col items-center gap-3 py-3">
		<div class="flex size-14 items-center justify-center rounded-full bg-primary/10">
			<Check class="size-7 text-primary" />
		</div>
		<p class="font-sans text-base font-medium text-foreground">You're on the list!</p>
	</div>
{:else if alreadyDone}
	<div in:fade={{ duration: 300 }} class="flex flex-col items-center py-3">
		<div class="flex size-14 items-center justify-center rounded-full bg-primary/10">
			<Check class="size-7 text-primary" />
		</div>
	</div>
{:else}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="flex flex-col gap-3"
	>
		<div
			class="flex w-full items-center rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
			class:ring-2={error}
			class:ring-destructive={error}
		>
			<Mail class="size-4 shrink-0 text-secondary/60" />
			<Input
				bind:value={email}
				oninput={() => (error = '')}
				type="email"
				placeholder="email@xyz.com"
				disabled={submitting}
				class="ml-2.5 h-8 flex-1 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-foreground/80 shadow-none placeholder:text-foreground/50 focus-visible:ring-0"
			/>
		</div>
		{#if error}
			<p class="-mt-1 px-2 font-sans text-sm text-destructive">{error}</p>
		{/if}
		<Button
			variant="primary"
			fullWidth
			disabled={!email.trim() || submitting}
			onclick={handleSubmit}
			data-umami-event={umamiSubmitEvent}
		>
			SIGN UP FOR UPDATES
		</Button>
	</form>
{/if}
