<script lang="ts">
	import { untrack } from 'svelte';
	import { Mail, MapPin, User } from '@lucide/svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import type { ApiClient, LocalizedEventDto } from '@crownshy/api-client/api';
	import { campaignPath, type CampaignOrg } from '@civicos/shared/data/place';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { Input } from '@civicos/shared/ui/input';
	import * as Form from '@civicos/shared/ui/form';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';
	import { BottomSheet, Button, FieldRow, ZipInput } from '$lib/components/ui';
	import EventCalendarInviteButton from '$lib/components/ui/EventCalendarInviteButton.svelte';
	import ThankYouMessage from '$lib/components/ui/ThankYouMessage.svelte';
	import eventRegistrationSchema from '$lib/components/ui/EventRegistrationSchema';
	import { registerForEvent, registrationErrorMessage } from '$lib/services/event-registration';
	import { saveProfile } from '$lib/services/profile';
	import { session } from '$lib/services/session.svelte';

	type Props = {
		open: boolean;
		event: LocalizedEventDto;
		/** The Campaign's Conversation, which the event and its attendance belong to. */
		conversationId: string;
		/** The Campaign's Host: named in the copy and credited in the calendar invite. */
		org: CampaignOrg | null;
		api: ApiClient;
		/** The signed-in account, when there is one, to fill the form from. */
		account: { email: string; name: string; zipCode: string } | null;
		preview: boolean;
		onSignOut: () => void;
		/** Fired once the attendance is filed, so the page can reflect it. */
		onRegistered?: () => void;
	};

	let {
		open = $bindable(false),
		event,
		conversationId,
		org,
		api,
		account,
		preview,
		onSignOut,
		onRegistered
	}: Props = $props();

	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let failure = $state('');

	// Seeded once: after this the form owns the fields, sign-out included.
	const initialFields = untrack(() => ({
		name: account?.name ?? '',
		email: account?.email ?? '',
		zipCode: account?.zipCode ?? ''
	}));
	const form = superForm(defaults(initialFields, zod4(eventRegistrationSchema)), {
		SPA: true,
		validators: zod4Client(eventRegistrationSchema),
		taintedMessage: false,
		resetForm: false,
		onUpdate: ({ form: submitted }) => {
			if (submitted.valid) void register(submitted.data);
		}
	});
	const { form: fields, enhance } = form;

	async function register({ name, email, zipCode }: typeof initialFields) {
		if (status === 'loading') return;
		status = 'loading';
		failure = '';

		try {
			const created = await registerForEvent(api, {
				conversationId,
				eventId: event.id,
				email: email.trim(),
				name: name.trim(),
				signedIn: !!account
			});
			// Only a new account is a session this browser holds, so only then is
			// there a profile to file the zip on.
			if (created) {
				session.rememberJoin(created, zipCode);
				await saveProfile({ api, preview }, { zipcode: zipCode });
				await invalidate('civicos:participant');
			}
			status = 'success';
			onRegistered?.();
		} catch (e) {
			console.error('[EventRegistration] Failed to register a participant:', e);
			failure = registrationErrorMessage(e);
			status = 'error';
		}
	}

	function signOut() {
		$fields.name = '';
		$fields.email = '';
		onSignOut();
	}
</script>

<BottomSheet
	bind:open
	label={event.name}
	title={status === 'success' ? "You're registered" : 'Join the Conversation'}
>
	{#if status === 'success'}
		<ThankYouMessage title="Thank you! We'll see you soon.">
			{#snippet message()}
				<div class="mt-6 flex flex-col gap-6 text-center font-sans text-lg text-foreground/80">
					<p>
						You should receive a confirmation email soon, plus more information and reminders
						shortly before the event.
					</p>
					<p>
						Email <a href="mailto:hello@bloom-project.org" class="font-bold text-destructive"
							>hello@bloom-project.org</a
						> if you have any questions.
					</p>
				</div>
			{/snippet}
		</ThankYouMessage>
	{:else}
		<p class="mx-auto mt-4 max-w-sm text-center font-sans text-base text-foreground">
			{#if account}
				You're signed in as {account.email}. Not you?
				<button type="button" class="text-destructive" onclick={signOut}>Sign out.</button>
			{:else}
				Enter your information so that {org?.name ?? 'the Host'} can get in touch with you.
			{/if}
		</p>
		<form id="event-join" method="POST" novalidate use:enhance class="mt-6 flex flex-col gap-2">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<FieldRow filled={!!account} hint="Required. First and last initial is fine.">
							{#snippet icon()}<User class="size-4" />{/snippet}
							<Input
								{...props}
								bind:value={$fields.name}
								maxlength={TEXT_LIMITS.participantName}
								autocomplete="name"
								placeholder="Your name..."
								class="h-8 rounded-none border-none bg-transparent p-0 text-xl font-medium shadow-none focus-visible:ring-0 md:text-xl"
							/>
						</FieldRow>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="px-4 text-sm text-destructive" />
			</Form.Field>
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<FieldRow filled={!!account}>
							{#snippet icon()}<Mail class="size-4" />{/snippet}
							<Input
								{...props}
								type="email"
								bind:value={$fields.email}
								readonly={!!account}
								maxlength={TEXT_LIMITS.email}
								autocomplete="email"
								placeholder="Your email..."
								class="h-8 rounded-none border-none bg-transparent p-0 text-lg shadow-none focus-visible:ring-0 md:text-lg"
							/>
						</FieldRow>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="px-4 text-sm text-destructive" />
			</Form.Field>
			<Form.Field {form} name="zipCode">
				<Form.Control>
					{#snippet children({ props })}
						<FieldRow filled={!!account && !!$fields.zipCode}>
							{#snippet icon()}<MapPin class="size-4" />{/snippet}
							<ZipInput bind:value={$fields.zipCode} appearance="field" placeholder="Zip code..." />
							<input type="hidden" name={props.name} value={$fields.zipCode} />
						</FieldRow>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="px-4 text-sm text-destructive" />
			</Form.Field>
		</form>
		{#if failure}
			<p class="mt-3 px-4 text-center font-sans text-sm text-destructive">{failure}</p>
		{/if}
	{/if}

	{#snippet footer()}
		{#if status === 'success'}
			<div class="flex w-full items-center justify-between gap-4">
				<EventCalendarInviteButton {event} {org} popupDirection="up" />
				<Button class="w-full" href={campaignPath(page.params.campaign)}>GO TO POLL</Button>
			</div>
		{:else}
			<Button
				type="submit"
				form="event-join"
				variant="primary"
				fullWidth
				disabled={status === 'loading'}
				class="font-display text-xl normal-case"
			>
				{#if status === 'loading'}<Spinner class="mr-3" />{/if}
				Sign Up
			</Button>
		{/if}
	{/snippet}
</BottomSheet>
