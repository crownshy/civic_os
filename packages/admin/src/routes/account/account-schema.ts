import { z } from 'zod';
import { username } from '$lib/auth/account-fields';

export const accountSchema = z.object({ username });

export type AccountMessage = { kind: 'ok' | 'error'; text: string };
