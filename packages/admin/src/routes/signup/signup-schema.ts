import { z } from 'zod';
import {
	newPassword,
	passwordsMatch,
	PASSWORDS_MISMATCH,
	username
} from '$lib/auth/account-fields';

export const signupSchema = z
	.object({
		username,
		email: z.email('Enter a valid email'),
		password: newPassword,
		confirmPassword: z.string()
	})
	.refine(passwordsMatch, PASSWORDS_MISMATCH);

export type SignupMessage = { kind: 'created' | 'error'; text: string };
