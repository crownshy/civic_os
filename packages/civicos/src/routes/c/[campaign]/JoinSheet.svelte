<script lang="ts">
	import { untrack } from 'svelte';
	import { Mail, MapPin, KeyRound } from '@lucide/svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { Input } from '@civicos/shared/ui/input';
	import * as Form from '@civicos/shared/ui/form';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { BottomSheet, Button, FieldRow, ZipInput } from '$lib/components/ui';
	import {
		continueAsSignedIn,
		joinWithCode,
		joinWithEmail,
		type EmailJoinContext
	} from '$lib/services/email-join';
	import { signUpForUpdates } from '$lib/services/join';
	import { joinSchema, loginCodeSchema } from './join-schema';

	type Props = {
		open: boolean;
		/** Shown in the sheet's corner. */
		campaignTitle: string;
		context: EmailJoinContext;
		/** The account's email when someone is signed in with one. */
		signedInEmail: string | null;
		/**
		 * Joined before as an anonymous guest. They keep that account, and its
		 * votes, and the email they type here is signed up for updates instead.
		 */
		isGuest: boolean;
		initialZip: string;
		/**
		 * True when this zip belongs to another legacy region and the page has
		 * sent the participant there instead.
		 */
		redirectsElsewhere: (zipCode: string) => boolean;
		onJoined: () => void;
		onSignOut: () => void;
	};

	let {
		open = $bindable(false),
		campaignTitle,
		context,
		signedInEmail,
		isGuest,
		initialZip,
		redirectsElsewhere,
		onJoined,
		onSignOut
	}: Props = $props();

	let step = $state<'details' | 'code'>('details');
	let failure = $state('');
	let submitting = $state(false);

	// Seeded once: after this the form owns both fields, sign-out included.
	const initialDetails = untrack(() => ({ email: signedInEmail ?? '', zipCode: initialZip }));
	const detailsForm = superForm(defaults(initialDetails, zod4(joinSchema)), {
		SPA: true,
		validators: zod4Client(joinSchema),
		taintedMessage: false,
		resetForm: false,
		onUpdate: ({ form }) => {
			if (form.valid) void submitDetails(form.data.email.trim(), form.data.zipCode.trim());
		}
	});
	const { form: details, enhance: enhanceDetails } = detailsForm;

	const codeForm = superForm(defaults(zod4(loginCodeSchema)), {
		SPA: true,
		validators: zod4Client(loginCodeSchema),
		taintedMessage: false,
		resetForm: false,
		onUpdate: ({ form }) => {
			if (form.valid) void submitCode(form.data.code.trim());
		}
	});
	const { form: code, enhance: enhanceCode } = codeForm;

	async function submitDetails(email: string, zipCode: string) {
		if (submitting || redirectsElsewhere(zipCode)) return;
		submitting = true;
		failure = '';

		if (signedInEmail) {
			await continueAsSignedIn(context, zipCode);
			finish();
			return;
		}

		if (isGuest) {
			// Not fatal: their email is a nice-to-have on an account that already votes.
			await signUpForUpdates(context, email);
			await continueAsSignedIn(context, zipCode);
			finish();
			return;
		}

		const result = await joinWithEmail(context, email, zipCode);
		submitting = false;
		if (result === 'joined') {
			finish();
		} else if (result === 'code-sent') {
			step = 'code';
		} else {
			failure = 'Something went wrong joining this conversation. Please try again.';
		}
	}

	async function submitCode(loginCode: string) {
		if (submitting) return;
		submitting = true;
		failure = '';
		const ok = await joinWithCode(
			context,
			$details.email.trim(),
			loginCode,
			$details.zipCode.trim()
		);
		submitting = false;
		if (ok) finish();
		else failure = "That code didn't work. Check your email and try again.";
	}

	function signOut() {
		$details.email = '';
		onSignOut();
	}

	function finish() {
		submitting = false;
		open = false;
		onJoined();
	}
</script>

<BottomSheet bind:open label={campaignTitle} title="Join the Conversation">
	{#if step === 'code'}
		<p class="mx-auto mt-4 max-w-sm text-center font-sans text-base text-foreground">
			{$details.email} already has an account. We've emailed it a code to sign in with.
		</p>
		<form id="join-code" method="POST" novalidate use:enhanceCode class="mt-6 flex flex-col gap-2">
			<Form.Field form={codeForm} name="code">
				<Form.Control>
					{#snippet children({ props })}
						<FieldRow>
							{#snippet icon()}<KeyRound class="size-4" />{/snippet}
							<Input
								{...props}
								bind:value={$code.code}
								inputmode="numeric"
								autocomplete="one-time-code"
								placeholder="Code from your email..."
								class="h-8 rounded-none border-none bg-transparent p-0 text-lg shadow-none focus-visible:ring-0 md:text-lg"
							/>
						</FieldRow>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="px-4 text-sm text-destructive" />
			</Form.Field>
		</form>
	{:else}
		<p class="mx-auto mt-4 max-w-sm text-center font-sans text-base text-foreground">
			{#if signedInEmail}
				You're signed in as {signedInEmail}. Not you?
				<button type="button" class="text-destructive" onclick={signOut}>Sign out.</button>
			{:else}
				To participate, you must be a real person living in this area. Please share your email and
				zip code below.
			{/if}
		</p>
		<form
			id="join-details"
			method="POST"
			novalidate
			use:enhanceDetails
			class="mt-6 flex flex-col gap-2"
		>
			<Form.Field form={detailsForm} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<FieldRow filled={!!signedInEmail}>
							{#snippet icon()}<Mail class="size-4" />{/snippet}
							<Input
								{...props}
								type="email"
								bind:value={$details.email}
								readonly={!!signedInEmail}
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
			<Form.Field form={detailsForm} name="zipCode">
				<Form.Control>
					{#snippet children({ props })}
						<FieldRow filled={!!signedInEmail && !!$details.zipCode}>
							{#snippet icon()}<MapPin class="size-4" />{/snippet}
							<ZipInput
								bind:value={$details.zipCode}
								appearance="field"
								placeholder="Zip code..."
							/>
							<input type="hidden" name={props.name} value={$details.zipCode} />
						</FieldRow>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="px-4 text-sm text-destructive" />
			</Form.Field>
		</form>
	{/if}

	{#if failure}
		<p class="mt-3 px-4 text-center font-sans text-sm text-destructive">{failure}</p>
	{/if}

	{#snippet footer()}
		<Button
			type="submit"
			form={step === 'code' ? 'join-code' : 'join-details'}
			variant="primary"
			fullWidth
			disabled={submitting}
			class="font-display text-xl normal-case"
		>
			{#if submitting}<Spinner class="mr-3" />{/if}
			{step === 'code' ? 'Sign in' : "Let's go!"}
		</Button>
	{/snippet}
</BottomSheet>
