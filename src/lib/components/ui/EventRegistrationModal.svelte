<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { Input } from '@civicos/shared/ui/input';
	import { Mail, User } from 'lucide-svelte';
	import { Button } from '$lib/components/ui';
	import { format } from 'date-fns';
	import * as Form from '@civicos/shared/ui/form';
	import { api } from '$lib/services/api';
	import type { ConversationEvent } from '$lib/types/mock-data';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import ThankYouMessage from './ThankYouMessage.svelte';
	import EventCalendarInviteButton from './EventCalendarInviteButton.svelte';
	import type { RegionConfig } from '$lib/config/regions';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import otpUserSignupSchema from './OtpUserSignupSchema';

	type Props = {
		open: boolean;
		event: ConversationEvent;
		region: RegionConfig;
	};

	let { open, event, region }: Props = $props();

	const formattedDate = $derived(event ? format(new Date(event.date), 'EEEE, MMMM d') : '');

	const form = superForm(defaults(zod(otpUserSignupSchema)), {
		validators: zodClient(otpUserSignupSchema),
		taintedMessage: false,
		onSubmit: handleSubmit
	});

	const { form: formData, errors, validateForm, enhance } = form;

	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let error = $state('');
	let formRef = $state<HTMLFormElement | null>(null);

	async function handleSubmit() {
		let result = await validateForm({ update: true });
		if (result.valid) {
			let { email, username } = result.data;

			try {
				status = 'loading';

				try {
					await api.SignupOtp({ email, username });
				} catch (e) {
					console.error(e);

					// Conflict status likely indicates user already exists in which case silently ignore
					if (e.response?.status !== 409) {
						throw new Error(e);
					}
				}

				await api.CreateEventAttendance(
					{ role: 'participant', user_email: email },
					{
						params: { conversation_id: region.conversationId, event_id: event.id }
					}
				);

				status = 'success';
			} catch (e) {
				console.error(e);
				error = e.response?.data?.err || 'Something went wrong registering you for the event';
				status = 'error';
			}
		}
	}
</script>

<Dialog
	bind:open
	title="Registration: Community Conversation"
	buttonText="← BACK TO CONVERSATIONS"
	description={`Fill out the below information to register for the ${event.name} community conversation on ${formattedDate}.`}
>
	{#if status === 'success'}
		<div class="flex flex-col justify-between gap-10">
			<ThankYouMessage title="Thank you! We'll see you soon.">
				{#snippet message()}
					<div
						class="mt-8 flex flex-col gap-8 font-sans text-lg leading-6 font-medium text-foreground/80"
					>
						<p class="text-center">
							You should receive a confirmation email soon, plus more information and reminders
							shortly before the event.
						</p>
						<p class="text-center">
							Email <a href="mailto:hello@bloom-project.org" class="font-bold text-red-500"
								>hello@bloom-project.org</a
							> if you have any questions.
						</p>
					</div>
				{/snippet}
			</ThankYouMessage>
		</div>
	{:else}
		<form
			class="mt-8 flex flex-col justify-between gap-4 px-7"
			bind:this={formRef}
			use:enhance
			method="POST"
		>
			<Form.Field {form} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex flex-col gap-2">
							<span class="relative">
								<Input
									bind:value={$formData.username}
									class="h-auto rounded-3xl py-6 pl-14 text-2xl md:text-2xl"
									placeholder="Username"
									{...props}
								/>
								<User class="absolute top-1/2 left-5 -translate-y-1/2" />
							</span>
							{#if $errors.username}
								<p class="text-red-500">{$errors.username}</p>
							{/if}
						</div>
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex flex-col gap-2">
							<span class="relative">
								<Input
									type="email"
									bind:value={$formData.email}
									class="h-auto rounded-3xl py-6 pl-14 text-2xl md:text-2xl"
									placeholder="Email address"
									{...props}
								/>
								<Mail class="absolute top-1/2 left-5 -translate-y-1/2" />
							</span>
							{#if $errors.email}
								<p class="text-red-500">{$errors.email}</p>
							{/if}
						</div>
					{/snippet}
				</Form.Control>
			</Form.Field>
			{#if error}<span class="text-center text-lg font-bold text-red-500">{error}</span>{/if}
		</form>
	{/if}
	{#snippet footer()}
		{#if status === 'success'}
			<div class="flex w-full items-center justify-between gap-4 px-7">
				<EventCalendarInviteButton {event} {region} popupDirection="up" />
				<Button class="w-full" href="/landing">GO TO POLL</Button>
			</div>
		{:else}
			<Button onclick={() => formRef?.requestSubmit()} class="w-full" disabled={!$formData.email}
				>Sign up{#if status === 'loading'}<Spinner class="ml-4" />{/if}</Button
			>
		{/if}
	{/snippet}
</Dialog>
