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
	import { welcomeSchema } from './welcome-schema';

	let { data } = $props();

	const form = superForm(
		untrack(() => data.form),
		{ validators: zod4Client(welcomeSchema) }
	);
	const { form: formData, enhance, submitting, message } = form;

	const linkProblemText = {
		missing: 'This page needs the link from your invite email. Open the email and use its button.',
		invalid: 'This link is not valid. Open the invite email again and use its button.',
		expired: 'This invite link has expired. Ask whoever added you to send a new one.'
	};

	const description = $derived(
		data.email
			? `You've been added to CivicOS Admin as ${data.email}. Choose a username and password to finish setting up your account.`
			: 'Choose a username and password to finish setting up your account.'
	);

	const labelClass = 'text-caption font-medium tracking-wider text-muted-foreground uppercase';
	const inputClass = 'h-10 rounded-md bg-background px-3 text-body md:text-body';
</script>

{#if data.linkProblem}
	<AuthCard title="Link not usable">
		<p class="text-body" role="alert">{linkProblemText[data.linkProblem]}</p>
		<Button href={resolve('/login')} variant="outline" class="h-10 w-full rounded-md text-body">
			Go to sign in
		</Button>
	</AuthCard>
{:else}
	<AuthCard title="Set up your account" {description}>
		<form method="POST" use:enhance aria-busy={$submitting} class="space-y-4">
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

			{#if $message}
				<p class="text-body text-destructive" role="alert">{$message}</p>
			{/if}

			<Button type="submit" disabled={$submitting} class="h-10 w-full rounded-md text-body">
				{#if $submitting}
					<Spinner />
					Setting up…
				{:else}
					Finish setup
				{/if}
			</Button>
		</form>
	</AuthCard>
{/if}
