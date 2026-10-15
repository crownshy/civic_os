import { z } from 'zod';
import {
	newPassword,
	passwordsMatch,
	PASSWORDS_MISMATCH,
	username
} from '$lib/auth/account-fields';

export const welcomeSchema = z
	.object({
		username,
		password: newPassword,
		confirmPassword: z.string()
	})
	.refine(passwordsMatch, PASSWORDS_MISMATCH);

export type WelcomeMessage = string;
