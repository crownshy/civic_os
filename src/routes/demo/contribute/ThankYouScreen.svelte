<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AboutBar, Button, EmojiCircle } from '$lib/components/ui';
	import { session } from '$lib/services/session.svelte';

	interface Props {
		countyName: string;
	}

	let { countyName }: Props = $props();

	let email = $state('');
	let submitting = $state(false);

	async function handleEmailSubmit() {
		if (!email.trim()) return;
		submitting = true;
		await session.registerEmail(email.trim());
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
			<h1 class="mt-6 text-center font-sans text-5xl font-bold leading-10 text-white">
				Thank you for your perspectives!
			</h1>
			<p class="mt-4 text-center font-sans text-lg font-medium leading-7 text-white/80">
				Here's what comes next...
			</p>
		{:else}
			<!-- No email yet — show thank you + email form -->
			<h1 class="mt-6 text-center font-sans text-5xl font-bold leading-10 text-white">
				Thank you!
			</h1>
			<p class="mt-2 text-center font-sans text-lg font-medium leading-7 text-white/80">
				You're done sharing your perspectives.
			</p>
		{/if}
	</div>

	{#if !session.emailProvided}
		<!-- Email collection panel -->
		<div class="flex shrink-0 flex-col items-start gap-4 border-t border-background px-7 py-8 bg-secondary">
			<p class="w-full text-center font-sans text-lg font-bold leading-7 text-white/80">
				Sign up to see what everyone else said and get updates on the conversation.
			</p>

			<form
				onsubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
				class="flex w-full items-center gap-2.5 rounded-full bg-white px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
			>
				<svg class="h-4 w-4 shrink-0 text-secondary" fill="currentColor" viewBox="0 0 20 20">
					<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
					<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
				</svg>
				<input
					bind:value={email}
					type="email"
					placeholder="email@xyz.com"
					disabled={submitting}
					class="flex-1 bg-transparent font-sans text-lg font-medium text-secondary placeholder:text-secondary/80 border-0 outline-none focus:ring-0"
				/>
			</form>

			<Button variant="primary" fullWidth disabled={!email.trim() || submitting} onclick={handleEmailSubmit}>
				SUBMIT
			</Button>

			<button
				class="w-full text-center font-mono text-base font-medium uppercase text-white/80"
				onclick={handleSkip}
			>
				NOT NOW
			</button>
		</div>
	{/if}
</div>
