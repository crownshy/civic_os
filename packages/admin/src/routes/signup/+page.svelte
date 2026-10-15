<script lang="ts">
	import '../../app.css';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Input } from '@civicos/shared/ui/input';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import AuthCard from '$lib/components/auth/AuthCard.svelte';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import { PASSWORD_HINT } from '$lib/auth/account-fields';
	import { signupSchema } from './signup-schema';

	let { data } = $props();

	const form = superForm(
		untrack(() => data.form),
		{ validators: zod4Client(signupSchema) }
	);
	const { form: formData, enhance, submitting, message } = form;

	const created = $derived($message?.kind === 'created');

	const labelClass = 'text-caption font-medium tracking-wider text-muted-foreground uppercase';
	const inputClass = 'h-10 rounded-md bg-background px-3 text-body md:text-body';
</script>

<AuthCard
	title={created ? 'Check your email' : 'Create an account'}
	description={created ? undefined : 'Set up your CivicOS Admin login.'}
>
	{#if created}
		<p class="text-body" role="status">{$message?.text}</p>
		<Button href={resolve('/login')} class="h-10 w-full rounded-md text-body">Go to sign in</Button>
	{:else}
		<form method="POST" use:enhance novalidate aria-busy={$submitting} class="space-y-4">
			<Form.Field {form} name="username" class="space-y-1.5">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class={labelClass}>Username</Form.Label>
						<Input
							{...props}
							autocomplete="username"
							bind:value={$formData.username}
							class={inputClass}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-caption text-destructive" />
			</Form.Field>

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
						<PasswordInput {...props} autocomplete="new-password" bind:value={$formData.password} />
					{/snippet}
				</Form.Control>
				<Form.Description class="text-caption text-muted-foreground"
					>{PASSWORD_HINT}</Form.Description
				>
				<Form.FieldErrors class="text-caption text-destructive" />
			</Form.Field>

			<Form.Field {form} name="confirmPassword" class="space-y-1.5">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class={labelClass}>Confirm password</Form.Label>
						<PasswordInput
							{...props}
							autocomplete="new-password"
							bind:value={$formData.confirmPassword}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-caption text-destructive" />
			</Form.Field>

			{#if $message?.kind === 'error'}
				<p class="text-body text-destructive" role="alert">{$message.text}</p>
			{/if}

			<Button type="submit" disabled={$submitting} class="h-10 w-full rounded-md text-body">
				{#if $submitting}
					<Spinner />
					Creating account…
				{:else}
					Create account
				{/if}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		Already have an account? <a
			href={resolve('/login')}
			class="font-medium text-foreground underline">Sign in</a
		>
	{/snippet}
</AuthCard>
