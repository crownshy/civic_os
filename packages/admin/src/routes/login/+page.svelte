<script lang="ts">
	import '../../app.css';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Input } from '@civicos/shared/ui/input';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import AuthCard from '$lib/components/auth/AuthCard.svelte';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import { loginSchema } from './login-schema';

	let { data } = $props();

	const form = superForm(
		untrack(() => data.form),
		{ validators: zod4Client(loginSchema) }
	);
	const { form: formData, enhance, submitting, message } = form;

	const denied = $derived(page.url.searchParams.get('denied') === '1');

	const labelClass = 'text-caption font-medium tracking-wider text-muted-foreground uppercase';
	const inputClass = 'h-10 rounded-md bg-background px-3 text-body md:text-body';
</script>

<AuthCard>
	<form method="POST" use:enhance aria-busy={$submitting} class="space-y-4">
		<Form.Field {form} name="email" class="space-y-1.5">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label class={labelClass}>Email</Form.Label>
					<Input
						{...props}
						type="email"
						autocomplete="email"
						bind:value={$formData.email}
						class={inputClass}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-caption text-destructive" />
		</Form.Field>

		<Form.Field {form} name="password" class="space-y-1.5">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label class={labelClass}>Password</Form.Label>
					<PasswordInput
						{...props}
						autocomplete="current-password"
						bind:value={$formData.password}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-caption text-destructive" />
		</Form.Field>

		{#if denied && !$message}
			<p class="text-body text-destructive">That account doesn't have admin access.</p>
		{/if}
		{#if $message}
			<p class="text-body text-destructive" role="alert">{$message}</p>
		{/if}

		<Button type="submit" disabled={$submitting} class="h-10 w-full rounded-md text-body">
			{#if $submitting}
				<Spinner />
				Signing in…
			{:else}
				Sign in
			{/if}
		</Button>
	</form>

	{#snippet footer()}
		New here? <a href={resolve('/signup')} class="font-medium text-foreground underline"
			>Create an account</a
		>
	{/snippet}
</AuthCard>
