<script lang="ts">
	import { CircleUser, LogOut, Mail, Menu } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import * as Popover from '@civicos/shared/ui/popover';
	import { cn } from '$lib/utils';

	type Props = {
		/** Someone is signed in, so the menu offers their account and a way out. */
		signedIn: boolean;
		onSignOut: () => void;
		/** Account links above Contact Support, such as the profile page. */
		accountItems?: Snippet<[{ close: () => void }]>;
	};

	let { signedIn, onSignOut, accountItems }: Props = $props();

	let open = $state(false);

	function close() {
		open = false;
	}

	function signOut() {
		close();
		onSignOut();
	}

	const itemClass =
		'flex w-full items-center gap-3.5 rounded-xl px-2 py-2 text-left font-sans text-base font-bold transition-colors hover:bg-muted active:bg-accent';
</script>

<!-- The page behind fades back while the menu is open, as in the design. -->
{#if open}
	<div
		class="fixed inset-0 z-40 bg-background/75"
		transition:fade={{ duration: 120 }}
		aria-hidden="true"
	></div>
{/if}

<Popover.Root bind:open>
	<Popover.Trigger
		aria-label="Account menu"
		class={cn(
			'relative z-50 flex h-8 touch-manipulation items-center gap-1.5 rounded-full px-1.5 transition-colors active:scale-95',
			open ? 'bg-foreground text-white' : 'bg-accent text-foreground'
		)}
	>
		{#if signedIn}
			<CircleUser class="size-5" />
		{/if}
		<Menu class="size-5" />
	</Popover.Trigger>
	<Popover.Content
		align="end"
		sideOffset={10}
		class="w-72 rounded-[30px] border-0 bg-white px-5 py-4 shadow-[0px_4px_24px_0px_rgba(134,101,73,0.20)]"
	>
		<nav class="flex flex-col gap-1 text-foreground">
			{#if accountItems}
				{@render accountItems({ close })}
			{/if}
			<a href="mailto:hello@bloom-project.org" class={itemClass} onclick={close}>
				<Mail class="size-4 shrink-0" />
				Contact Support
			</a>
			{#if signedIn}
				<button type="button" class={cn(itemClass, 'text-destructive')} onclick={signOut}>
					<LogOut class="size-4 shrink-0" />
					Log Out
				</button>
			{/if}
		</nav>
	</Popover.Content>
</Popover.Root>
