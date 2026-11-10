<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Input } from '@civicos/shared/ui/input';
	import { Button } from '@civicos/shared/ui/button';
	import { accountSchema, type AccountMessage } from './account-schema';

	let { data } = $props();

	const viewer = $derived(data.viewer);

	const form = superForm(
		untrack(() => data.form),
		{ validators: zod4Client(accountSchema), resetForm: false }
	);
	const { form: formData, enhance, submitting, message, tainted } = form;
	const msg = $derived($message as AccountMessage | undefined);

	const SUPPORT = 'hello@bloom-project.org';
	const emailChangeHref = `mailto:${SUPPORT}?subject=${encodeURIComponent('Change my admin email')}`;

	const labelClass = 'text-caption font-medium tracking-wider text-muted-foreground uppercase';
</script>

<svelte:head>
	<title>Account</title>
</svelte:head>

<!-- The app shell clips overflow, so the page scrolls itself (#461). -->
<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto flex max-w-2xl flex-col gap-8 p-6 sm:p-8">
		<div>
			<h1 class="text-h4 font-bold md:text-h3">Account</h1>
			<p class="mt-1 text-body text-muted-foreground">Who you are signed in as.</p>
		</div>

		<form
			method="POST"
			use:enhance
			novalidate
			class="flex flex-col gap-3 rounded-xl border border-border p-5"
		>
			<Form.Field {form} name="username" class="flex flex-col gap-1.5">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class={labelClass}>Username</Form.Label>
						<Input
							{...props}
							autocomplete="username"
							bind:value={$formData.username}
							class="h-10 rounded-md bg-background px-3 text-body md:text-body"
						/>
					{/snippet}
				</Form.Control>
				<Form.Description class="text-caption text-muted-foreground">
					Shown in the sidebar and to other people on your Host.
				</Form.Description>
				<Form.FieldErrors class="text-caption text-destructive" />
			</Form.Field>
			<div class="flex items-center gap-3">
				<Button type="submit" disabled={$submitting || !$tainted}>
					{$submitting ? 'Saving…' : 'Save username'}
				</Button>
				{#if msg && !$tainted}
					<p
						class={msg.kind === 'ok'
							? 'text-caption text-primary'
							: 'text-caption text-destructive'}
						role={msg.kind === 'error' ? 'alert' : 'status'}
					>
						{msg.text}
					</p>
				{/if}
			</div>
		</form>

		<section class="flex flex-col gap-1.5">
			<h2 class={labelClass}>Email</h2>
			<p class="text-body">{viewer?.email ?? 'No email on this account'}</p>
			<p class="text-caption text-muted-foreground">
				You sign in with this. To change it,
				<a href={emailChangeHref} class="text-primary underline-offset-2 hover:underline"
					>email support</a
				>.
			</p>
		</section>

		<section class="flex flex-col gap-1.5">
			<h2 class={labelClass}>Role</h2>
			<p class="text-body">{viewer?.role ?? 'Not on a Host yet'}</p>
			{#if viewer?.hostId}
				<a
					href={resolve('/hosts/[id]', { id: viewer.hostId })}
					class="text-caption text-primary underline-offset-2 hover:underline"
				>
					Open your Host
				</a>
			{/if}
		</section>
	</div>
</div>
