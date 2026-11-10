import type { ApiClient, UserDto } from '@crownshy/api-client/api';
import { invalidate } from '$app/navigation';
import { httpStatusOf } from '$lib/utils/http';
import { enterCampaign, type JoinContext } from './join';
import { saveProfile } from './profile';
import { session } from './session.svelte';

/** A Campaign's join context, plus the calls that sign a participant in by email. */
export interface EmailJoinContext extends JoinContext {
	api: JoinContext['api'] & Pick<ApiClient, 'SignupOtp' | 'CreateOtp' | 'LoginOtpUser'>;
}

/**
 * What joining by email came to.
 *
 * `code-sent` is an email that already has an account. Comhairle will not
 * sign that in without proof, so a code is on its way and the participant
 * finishes with `joinWithCode`.
 */
export type EmailJoinResult = 'joined' | 'code-sent' | 'failed';

/**
 * Create an account for this email, sign this browser in as it and put it on
 * the Campaign.
 *
 * Comhairle sends a verification email from the same call but does not wait on
 * it: the participant is signed in and voting before they have read it, which
 * is what the design asks for.
 */
export async function joinWithEmail(
	context: EmailJoinContext,
	email: string,
	zipCode: string
): Promise<EmailJoinResult> {
	if (context.preview) return 'joined';

	let user: UserDto;
	try {
		// Comhairle fills a missing username with the part before the @, and
		// usernames are unique, so jane@a.com would 409 on jane@b.com's account
		// and read as "already signed up". The whole email is unique by construction.
		user = await context.api.SignupOtp({ email, username: email });
	} catch (e) {
		if (httpStatusOf(e) === 409) return sendLoginCode(context, email);
		console.error('[Join] Failed to sign up by email:', e);
		return 'failed';
	}

	await finishJoin(context, user, zipCode);
	return 'joined';
}

/** Sign in an email that already had an account, with the code it was sent. */
export async function joinWithCode(
	context: EmailJoinContext,
	email: string,
	code: string,
	zipCode: string
): Promise<boolean> {
	if (context.preview) return true;

	let user: UserDto;
	try {
		user = await context.api.LoginOtpUser({ email, code });
	} catch (e) {
		console.error('[Join] Failed to sign in with a code:', e);
		return false;
	}

	await finishJoin(context, user, zipCode);
	return true;
}

/**
 * Put a participant who is already signed in on this Campaign, saving the zip
 * when they changed it in the sheet.
 */
export async function continueAsSignedIn(context: JoinContext, zipCode: string): Promise<void> {
	if (zipCode && zipCode !== session.zipCode) {
		session.zipCode = zipCode;
		await saveProfile(context, { zipcode: zipCode });
	}
	await enterCampaign(context);
}

async function sendLoginCode(context: EmailJoinContext, email: string): Promise<EmailJoinResult> {
	try {
		await context.api.CreateOtp({ email });
		return 'code-sent';
	} catch (e) {
		console.error('[Join] Failed to send a login code:', e);
		return 'failed';
	}
}

async function finishJoin(context: JoinContext, user: UserDto, zipCode: string): Promise<void> {
	session.rememberJoin(user, zipCode);
	await enterCampaign(context);
	// Best effort, for the same reason as in `join`: the zip is cached either way.
	if (zipCode) await saveProfile(context, { zipcode: zipCode });
	await invalidate('civicos:participant');
}
