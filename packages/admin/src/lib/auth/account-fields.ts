import { z } from 'zod';

/**
 * Mirrors comhairle's `validate_password_strength` (api/src/routes/auth.rs), so a
 * weak password is caught on the form instead of coming back as a bare 400.
 */
export const PASSWORD_MIN_LENGTH = 16;

const PASSWORD_CATEGORIES = [/\p{Lu}/u, /\p{Ll}/u, /[0-9]/, /[^\p{L}\p{N}\s]/u];

export function passwordCategoryCount(password: string): number {
	return PASSWORD_CATEGORIES.filter((re) => re.test(password)).length;
}

export const newPassword = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
	.refine(
		(p) => passwordCategoryCount(p) >= 3,
		'Use at least three of: uppercase, lowercase, a number, a symbol'
	);

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with three of: uppercase, lowercase, a number, a symbol.`;

export const username = z
	.string()
	.trim()
	.min(3, 'Use at least 3 characters')
	.max(40, 'Use 40 characters or fewer')
	.regex(/^[A-Za-z0-9_.-]+$/, 'Use letters, numbers, dots, dashes or underscores');

export const PASSWORDS_MISMATCH = {
	message: 'Passwords do not match',
	path: ['confirmPassword']
};

export function passwordsMatch(d: { password: string; confirmPassword: string }) {
	return d.password === d.confirmPassword;
}
