<script lang="ts">
	import '../../app.css';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Input } from '@civicos/shared/ui/input';
	import { Button } from '@civicos/shared/ui/button';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import { Eye, EyeOff } from '@lucide/svelte';
	import { loginSchema } from './login-schema';

	let { data } = $props();

	const form = superForm(
		untrack(() => data.form),
		{ validators: zod4Client(loginSchema) }
	);
	const { form: formData, enhance, submitting, message } = form;

	let showPassword = $state(false);

	const denied = $derived(page.url.searchParams.get('denied') === '1');

	const labelClass = 'text-caption font-medium tracking-wider text-muted-foreground uppercase';
	const inputClass = 'h-10 rounded-md bg-background px-3 text-body md:text-body';
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
	<form
		method="POST"
		use:enhance
		aria-busy={$submitting}
		class="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="size-8 shrink-0 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl bg-primary"
			></div>
			<span class="text-body font-bold">CivicOS Admin</span>
		</div>

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
					<div class="relative">
						<Input
							{...props}
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							bind:value={$formData.password}
							class="{inputClass} pr-11"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							class="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							aria-pressed={showPassword}
							onclick={() => (showPassword = !showPassword)}
						>
							{#if showPassword}<EyeOff />{:else}<Eye />{/if}
						</Button>
					</div>
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
</div>
