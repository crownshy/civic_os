<script lang="ts">
	import { scale, slide, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AboutBar, Button, EmojiCircle } from '$lib/components/ui';
	import { session } from '$lib/services/session.svelte';
    import { Mail } from 'lucide-svelte'

	interface Props {
		countyName: string;
	}

	let { countyName }: Props = $props();

	let email = $state('');
	let submitting = $state(false);
	let emailError = $state('');

	function isValidEmail(value: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	async function handleEmailSubmit() {
		emailError = '';
		const trimmed = email.trim();
		if (!trimmed) {
			emailError = 'Please enter an email address';
			return;
		}
		if (!isValidEmail(trimmed)) {
			emailError = 'Please enter a valid email address';
			return;
		}
		submitting = true;
		await session.registerEmail(trimmed);
		// Mark as provided even if API fails (demo mode)
		session.emailProvided = true;
		submitting = false;
	}

	function handleSkip() {
		session.emailProvided = true;
	}
</script>

<div class="flex h-full flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<AboutBar {countyName} />

	<!-- Centered content -->
	<div class="flex flex-1 flex-col items-center justify-center px-8">
		<!-- Emoji -->
		<EmojiCircle emoji="🎉" size="lg" />

		{#if session.emailProvided}
			<!-- Email already given — clean thank you -->
			<div in:fade={{ duration: 400, delay: 300 }}>
				<h1 class="mt-6 text-center font-sans text-5xl font-bold leading-10 text-foreground">
					Thank you for your perspectives!
				</h1>
				<p class="mt-4 text-center font-sans text-lg font-medium leading-7 text-foreground/80">
					Here's what comes next...
				</p>
			</div>
		{:else}
			<!-- No email yet — show thank you + email form -->
			<div out:fade={{ duration: 200 }}>
				<h1 class="mt-6 text-center font-sans text-5xl font-bold leading-10 text-foreground">
					Thank you!
				</h1>
				<p class="mt-2 text-center font-sans text-lg font-medium leading-7 text-foreground/80">
					You're done sharing your perspectives.
				</p>
			</div>
		{/if}
	</div>

	{#if !session.emailProvided}
		<!-- Email collection panel -->
		<div
			out:slide={{ duration: 400, easing: cubicOut }}
			class="flex shrink-0 flex-col items-start gap-4 border-t-2 border-secondary/20 px-7 py-8 bg-secondary/10"
		>
			<p class="w-full text-center font-sans text-lg font-bold leading-7 text-foreground/80">
				Sign up to see what everyone else said and get updates on the conversation.
			</p>

			<div class="w-full">
				<form
					onsubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
					class="flex w-full items-center justify-center rounded-full bg-card px-5 py-1 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
					class:ring-2={emailError}
					class:ring-destructive={emailError}
				>
					<Mail class="mt-1 text-secondary size-4"/>
					<input
						bind:value={email}
						oninput={() => emailError = ''}
						type="email"
						placeholder="email@xyz.com"
						disabled={submitting}
						class="flex-1 bg-transparent font-sans text-lg font-medium text-secondary placeholder:text-secondary/80 border-0 outline-none focus:ring-0"
					/>
				</form>
				{#if emailError}
					<p class="mt-1.5 px-2 font-sans text-sm text-destructive">{emailError}</p>
				{/if}
			</div>

			<Button variant="primary" fullWidth disabled={!email.trim() || submitting} onclick={handleEmailSubmit}>
				SUBMIT
			</Button>

			<button
				class="w-full text-center font-mono text-base font-medium uppercase text-foreground/80"
				onclick={handleSkip}
			>
				NOT NOW
			</button>
		</div>
	{/if}
</div>
