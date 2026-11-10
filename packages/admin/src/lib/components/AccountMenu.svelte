<script lang="ts">
	import { LogOut, Mail, UserRound } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import * as Popover from '@civicos/shared/ui/popover';
	import { cn } from '@civicos/shared/utils';
	import type { Viewer } from '$lib/viewer';

	type Props = {
		viewer: Viewer | null;
		/** The sidebar is an icon rail, so only the avatar shows. */
		compact: boolean;
	};

	let { viewer, compact }: Props = $props();

	let open = $state(false);

	const name = $derived(viewer?.name ?? 'Signed in');
	const label = $derived([name, viewer?.role].filter(Boolean).join(', '));

	const itemClass =
		'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-caption font-medium transition-colors hover:bg-muted';
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		aria-label="Account menu"
		title={label}
		class={cn(
			'flex min-w-0 items-center rounded-lg text-left transition-colors hover:bg-muted',
			compact ? 'justify-center p-1' : 'w-full gap-4 px-1.5 py-1',
			open && 'bg-muted'
		)}
	>
		<span
			aria-hidden="true"
			class="grid size-7 shrink-0 place-items-center rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-foreground text-caption font-semibold text-background uppercase"
		>
			{name.charAt(0)}
		</span>
		{#if !compact}
			<span class="min-w-0 flex-1">
				<span class="block truncate text-caption font-medium">{name}</span>
				{#if viewer?.role}
					<span class="block truncate text-label text-muted-foreground">{viewer.role}</span>
				{/if}
			</span>
		{/if}
	</Popover.Trigger>
	<Popover.Content
		side="top"
		align="start"
		sideOffset={8}
		class="w-64 rounded-xl border border-muted-foreground/20 p-1 shadow-lg"
	>
		<div class="border-b border-border px-2.5 pt-1.5 pb-2.5">
			<p class="truncate text-caption font-semibold">{name}</p>
			{#if viewer?.email && viewer.email !== name}
				<p class="truncate text-label text-muted-foreground">{viewer.email}</p>
			{/if}
			{#if viewer?.role}
				<p class="truncate text-label text-muted-foreground">{viewer.role}</p>
			{/if}
		</div>
		<nav class="flex flex-col pt-1">
			<a href={resolve('/account')} class={itemClass} onclick={() => (open = false)}>
				<UserRound class="size-4 shrink-0" />
				Account
			</a>
			<a href="mailto:hello@bloom-project.org" class={itemClass} onclick={() => (open = false)}>
				<Mail class="size-4 shrink-0" />
				Contact support
			</a>
			<form method="POST" action="/logout">
				<button type="submit" class={cn(itemClass, 'text-destructive')}>
					<LogOut class="size-4 shrink-0" />
					Sign out
				</button>
			</form>
		</nav>
	</Popover.Content>
</Popover.Root>
