<script lang="ts">
	import { UserRound } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { signOut } from '$lib/services/sign-out';
	import { cn } from '$lib/utils';
	import AccountMenu from './AccountMenu.svelte';

	type Props = {
		/** Where the Campaign runs, after the wordmark. Left out on pages with no Place. */
		placeName?: string;
		class?: string;
	};

	let { placeName, class: className }: Props = $props();

	// Read from the root layout, which re-resolves on `civicos:participant`, so
	// the menu follows a sign-in or sign-out without the page passing it down.
	const signedIn = $derived(!!page.data.participant);
</script>

<header class={cn('flex items-center justify-between px-6 py-4', className)}>
	<p class="flex items-baseline gap-2 font-display text-foreground">
		<span class="text-xl font-bold">civicOS</span>
		{#if placeName}
			<span aria-hidden="true">•</span>
			<span class="text-sm font-bold lowercase">{placeName}</span>
		{/if}
	</p>
	<AccountMenu {signedIn} onSignOut={() => signOut(page.data.api)}>
		{#snippet accountItems({ close })}
			{#if signedIn}
				<a
					href={resolve('/profile')}
					onclick={close}
					class="flex w-full items-center gap-3.5 rounded-xl px-2 py-2 font-sans text-base font-bold transition-colors hover:bg-muted active:bg-accent"
				>
					<UserRound class="size-4 shrink-0" />
					User Profile
				</a>
			{/if}
		{/snippet}
	</AccountMenu>
</header>
