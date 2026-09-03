import { describe, it, expect, vi } from 'vitest';
import type { EventAttendanceEtx } from '@crownshy/api-client/api';
import { findAttendance, type AttendanceApi } from './event-attendance';

const CAMPAIGN = '11111111-1111-1111-1111-111111111111';
const EVENT = '22222222-2222-2222-2222-222222222222';
const USER = '33333333-3333-3333-3333-333333333333';

function attendance(overrides: Partial<EventAttendanceEtx> = {}): EventAttendanceEtx {
	return {
		id: '44444444-4444-4444-4444-444444444444',
		eventId: EVENT,
		userId: 'someone-else',
		role: 'participant',
		createdAt: '2026-09-01T10:00:00Z',
		updatedAt: '2026-09-01T10:00:00Z',
		...overrides
	};
}

/**
 * The client's own parameter type is a deep-readonly union over every endpoint,
 * so the stub is written against what this call actually passes and cast.
 */
function fakeApi(pages: EventAttendanceEtx[][]) {
	const listing = vi.fn(({ queries }: { queries: { limit: number; offset: number } }) =>
		Promise.resolve({
			records: pages[queries.offset / queries.limit] ?? [],
			total: pages.flat().length
		})
	);

	return { api: { ListEventAttendances: listing } as unknown as AttendanceApi, listing };
}

const lookup = { conversationId: CAMPAIGN, eventId: EVENT, userId: USER };

describe('findAttendance', () => {
	it('finds the participant on the list', async () => {
		const { api } = fakeApi([[attendance(), attendance({ userId: USER })]]);

		await expect(findAttendance(api, lookup)).resolves.toEqual({
			registered: true,
			resolved: true
		});
	});

	it('matches on email, which is how registering by email files it', async () => {
		const { api } = fakeApi([[attendance({ email: 'Someone@Example.com ' })]]);

		await expect(findAttendance(api, { ...lookup, email: 'someone@example.com' })).resolves.toEqual(
			{ registered: true, resolved: true }
		);
	});

	it('answers no when the list does not name them', async () => {
		const { api } = fakeApi([[attendance(), attendance()]]);

		await expect(findAttendance(api, lookup)).resolves.toEqual({
			registered: false,
			resolved: true
		});
	});

	it('pages until it finds them', async () => {
		const full = Array.from({ length: 100 }, () => attendance());
		const { api, listing } = fakeApi([full, [attendance({ userId: USER })]]);

		await expect(findAttendance(api, lookup)).resolves.toEqual({
			registered: true,
			resolved: true
		});
		expect(listing).toHaveBeenCalledTimes(2);
	});

	it('leaves the answer unresolved rather than guessing when the walk runs out', async () => {
		const full = Array.from({ length: 100 }, () => attendance());
		const { api } = fakeApi(Array.from({ length: 12 }, () => full));

		await expect(findAttendance(api, lookup)).resolves.toEqual({
			registered: false,
			resolved: false
		});
	});

	it('leaves the answer unresolved when the backend rejects', async () => {
		const api = {
			ListEventAttendances: vi.fn(() => Promise.reject(new Error('403')))
		} as unknown as AttendanceApi;
		vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(findAttendance(api, lookup)).resolves.toEqual({
			registered: false,
			resolved: false
		});
	});

	it('does not ask on behalf of a visitor the cookie does not name', async () => {
		const { api, listing } = fakeApi([[attendance({ userId: USER })]]);

		await expect(findAttendance(api, { ...lookup, userId: '' })).resolves.toEqual({
			registered: false,
			resolved: true
		});
		expect(listing).not.toHaveBeenCalled();
	});
});
