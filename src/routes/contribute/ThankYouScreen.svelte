<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { AboutBar, Button, EmojiCircle, Link } from '$lib/components/ui';
	import { Input } from '$lib/components/ui/input';
	import { session } from '$lib/services/session.svelte';
	import { Mail } from 'lucide-svelte';
	import type { RegionConfig } from '$lib/config/regions';

	interface Props {
		countyName: string;
		region:RegionConfig;
		onBackToVoting?: () => void;
	}

	let { countyName, onBackToVoting, region }: Props = $props();

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
		session.emailProvided = true;
		submitting = false;
	}
</script>

<div class="flex h-full flex-col bg-gradient-primary" in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}>
	<div class="flex flex-1 flex-col overflow-y-auto">
		<AboutBar region={region} {countyName} onBack={onBackToVoting} />
		<!-- Hero: emoji + heading -->
		<div class="flex flex-col items-center px-8 pt-14">
			<EmojiCircle emoji="🎉" size="lg" />

			<h1 class="mt-6 text-center font-sans text-4xl font-bold leading-10 text-foreground">
				Thank you!
			</h1>

			{#if session.emailProvided}
				<p class="mt-2 text-center font-sans text-base font-medium leading-6 text-foreground/80" in:fade={{ duration: 400, delay: 300 }}>
					Received! We'll be in touch.
				</p>
			{:else}
				<p class="mt-2 text-center font-sans text-base font-medium leading-6 text-foreground/80">
					Share your email to receive updates on this conversation and future opportunities to get involved.
				</p>
			{/if}
		</div>

		<!-- Email capture (inline, not a bottom panel) -->
		{#if !session.emailProvided}
			<div class="mt-4 flex flex-col gap-3.5 px-7">
				<form
					onsubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
					class="flex w-full items-center rounded-full bg-card px-5 py-3 shadow-[inset_2.2px_4.4px_4.4px_0px_rgba(0,0,0,0.10)]"
					class:ring-2={emailError}
					class:ring-destructive={emailError}
				>
					<Mail class="text-secondary/60 size-4 shrink-0" />
					<Input
						bind:value={email}
						oninput={() => emailError = ''}
						type="email"
						placeholder="email@xyz.com"
						disabled={submitting}
						class="ml-2.5 flex-1 h-8 rounded-none border-0 bg-transparent font-sans text-lg font-medium text-foreground/80 placeholder:text-foreground/50 shadow-none focus-visible:ring-0"
					/>
				</form>
				{#if emailError}
					<p class="-mt-2 px-2 font-sans text-sm text-destructive">{emailError}</p>
				{/if}

				<Button variant="primary" fullWidth disabled={!email.trim() || submitting} onclick={handleEmailSubmit}>
					SIGN UP FOR UPDATES
				</Button>
			</div>
		{/if}

		<!-- Live Conversations section -->
		<div class="mt-8 px-7 pb-8">
			<div class="flex items-center gap-2">
				<span class="rounded-[5px] bg-destructive px-2 py-1 font-sans text-sm font-bold leading-5 text-card">NEXT UP</span>
				<span class="font-sans text-2xl font-bold leading-9 text-foreground">Live Conversations</span>
			</div>

			<div class="mt-4 font-sans text-lg font-normal leading-7 text-foreground">
				<p>
				  {@html region.whatsNext}
				</p>
			</div>

			<div class="flex items-center gap-2">
				<span class="rounded-[5px] bg-destructive px-2 py-1 font-sans text-sm font-bold leading-5 text-card">GO DEEPER</span>
			</div>
			<div>

				<p class="mt-4">
				  {@html region.goDeeper}
				</p>
			
				<div class="mt-8 outline-[0.5px] outline-foreground/40"></div>

				<p class="mt-14">
					Have some feedback or ideas? <Link href="https://form.jotform.com/260746654096062" external class="font-bold">Fill out a survey</Link> about your experience with this website.
				</p>
			</div>
		</div>
	</div>
</div>
