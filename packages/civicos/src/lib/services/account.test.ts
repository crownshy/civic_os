import { describe, expect, it, vi } from 'vitest';
import { invalidate } from '$app/navigation';
import { displayName, renameAccount } from './account';

vi.mock('$app/navigation', () => ({ invalidate: vi.fn() }));

function httpError(status: number) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status }
	});
}

describe('renameAccount', () => {
	it('saves the name as the username and refreshes the participant', async () => {
		const api = { UpdateUserDetails: vi.fn(() => Promise.resolve({})) };

		expect(await renameAccount(api as never, 'Jane S')).toBe('saved');
		expect(api.UpdateUserDetails).toHaveBeenCalledWith({ username: 'Jane S' });
		expect(invalidate).toHaveBeenCalledWith('civicos:participant');
	});

	it('says when the name is taken', async () => {
		const api = { UpdateUserDetails: vi.fn(() => Promise.reject(httpError(409))) };

		expect(await renameAccount(api as never, 'Jane S')).toBe('taken');
	});
});

describe('displayName', () => {
	it('treats an email standing in as the username as no name', () => {
		expect(displayName('a@example.com', 'a@example.com')).toBe('');
		expect(displayName(null, 'a@example.com')).toBe('');
		expect(displayName('Jane S', 'a@example.com')).toBe('Jane S');
	});
});
