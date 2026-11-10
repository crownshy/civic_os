<script lang="ts">
	import { Mail, MapPin } from '@lucide/svelte';
	import { Button, FieldRow, SiteHeader, ZipInput } from '$lib/components/ui';
	import { displayName } from '$lib/services/account';
	import { saveProfile } from '$lib/services/profile';
	import { session } from '$lib/services/session.svelte';
	import NameCard from './NameCard.svelte';

	let { data } = $props();

	const SUPPORT_EMAIL = 'hello@bloom-project.org';

	const participant = $derived(data.participant);
	const name = $derived(displayName(participant?.username ?? null, participant?.email ?? null));

	// The server's zip, then the cached one, which `join.ts` keeps while comhairle
	// cannot always store it. Writable, so a pick shows before the save lands.
	let zipCode = $derived(participant?.zipCode || session.zipCode);
	let zipStatus = $state<'idle' | 'saving' | 'saved' | 'failed'>('idle');

	async function saveZip(zip: string) {
		zipCode = zip;
		if (!zip) return;
		zipStatus = 'saving';
		session.zipCode = zip;
		const ok = await saveProfile({ api: data.api, preview: false }, { zipcode: zip });
		zipStatus = ok ? 'saved' : 'failed';
	}

	const deleteHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Delete my account')}`;
	const dataHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('My participation data')}`;
</script>

<svelte:head>
	<title>User Profile</title>
</svelte:head>

<div class="min-h-dvh bg-background">
	<div class="mx-auto w-full max-w-2xl">
		<SiteHeader />

		<main class="flex flex-col gap-10 px-6 pt-6 pb-16">
			<section class="flex flex-col gap-3">
				<h1 class="font-display text-4xl font-medium tracking-display text-foreground">
					User Profile
				</h1>
				<p class="font-sans text-base text-foreground">
					View and change your basic information. Changes are saved as you make them.
				</p>
				<NameCard {name} api={data.api} />
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="font-display text-2xl font-medium text-foreground">Email</h2>
				<p class="font-sans text-base text-foreground">
					Used for login, system updates, and communication with Hosts (as permitted).
				</p>
				<FieldRow>
					{#snippet icon()}<Mail class="size-4" />{/snippet}
					<span class="truncate text-lg text-foreground">
						{participant?.email ?? 'No email on this account yet'}
					</span>
				</FieldRow>
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="font-display text-2xl font-medium text-foreground">Home Location</h2>
				<p class="font-sans text-base text-foreground">
					Used to make sure you are in the places where conversations are happening.
				</p>
				<FieldRow>
					{#snippet icon()}<MapPin class="size-4" />{/snippet}
					<ZipInput
						bind:value={() => zipCode, saveZip}
						appearance="field"
						placeholder="Zip code..."
					/>
				</FieldRow>
				{#if zipStatus === 'saving'}
					<p class="px-4 text-sm text-foreground/70">Saving…</p>
				{:else if zipStatus === 'saved'}
					<p class="px-4 text-sm text-primary">Saved</p>
				{:else if zipStatus === 'failed'}
					<p class="px-4 text-sm text-destructive">
						Couldn't save your location. Please try again.
					</p>
				{/if}
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="font-display text-2xl font-medium text-foreground">Access My Data</h2>
				<p class="font-sans text-base text-foreground">
					<a href={dataHref} class="text-destructive">Email the support team</a> to get access to your
					participation history, including statements, votes, etc.
				</p>
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="font-display text-2xl font-medium text-foreground">Delete my Account</h2>
				<p class="font-sans text-base text-foreground">
					This action cannot be undone. Email the support team and we'll delete it for you.
				</p>
				<Button
					variant="destructive"
					href={deleteHref}
					fullWidth
					class="mt-2 h-14 font-display text-xl normal-case"
				>
					Delete My Account
				</Button>
			</section>
		</main>
	</div>
</div>
