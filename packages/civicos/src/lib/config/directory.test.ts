import { describe, expect, it } from 'vitest';
import { REGIONS } from '@civicos/shared/data/regions';
import { toDirectory, type DirectoryConversation } from './directory';
import { apexHost } from './place';
import type { RegionConfig } from './regions';

const oregon = REGIONS.oregon as RegionConfig;

function conversation(overrides: Partial<DirectoryConversation> = {}): DirectoryConversation {
	return {
		id: 'c1',
		slug: 'ai-dundee',
		title: 'AI and our communities',
		shortDescription: 'What should AI do here?',
		isLive: true,
		isPublic: true,
		isInviteOnly: false,
		isComplete: false,
		metadata: { place: { slug: 'dundee', name: 'Dundee' } },
		...overrides
	};
}

describe('apexHost', () => {
	it('strips the Place subdomain', () => {
		expect(apexHost('utah.bloomproject.us')).toBe('bloomproject.us');
	});

	it('leaves an apex request alone', () => {
		expect(apexHost('bloomproject.us')).toBe('bloomproject.us');
	});

	it('keeps the port, which local dev is served on', () => {
		expect(apexHost('dundee.localhost:5173')).toBe('localhost:5173');
		expect(apexHost('localhost:5173')).toBe('localhost:5173');
	});
});

describe('toDirectory', () => {
	it('addresses a Campaign at its own Place, not at the host asking', () => {
		const [entry] = toDirectory([conversation()], 'bloomproject.us');

		expect(entry.url).toBe('https://dundee.bloomproject.us/host/conversations/ai');
		expect(entry.place).toEqual({ slug: 'dundee', name: 'Dundee' });
	});

	it('uses the Host for the org segment when the metadata names one', () => {
		const listed = conversation({
			metadata: { place: { slug: 'dundee', name: 'Dundee' }, org: { name: 'Young Scot' } }
		});

		expect(toDirectory([listed], 'bloomproject.us')[0].url).toBe(
			'https://dundee.bloomproject.us/young-scot/conversations/ai'
		);
	});

	it('serves a Campaign with no Place from the apex', () => {
		const listed = conversation({ slug: 'ai', metadata: {} });

		expect(toDirectory([listed], 'bloomproject.us')[0]).toMatchObject({
			place: null,
			url: 'https://bloomproject.us/host/conversations/ai'
		});
	});

	it('resolves a legacy region through the Conversation it owns', () => {
		const listed = conversation({ id: oregon.conversationId, slug: 'oregon', metadata: {} });

		expect(toDirectory([listed], 'bloomproject.us')[0].url).toBe(
			`https://oregon.bloomproject.us/host/conversations/oregon`
		);
	});

	it('leaves out what a stranger cannot join', () => {
		const closed = [
			conversation({ id: 'draft', isLive: false }),
			conversation({ id: 'private', isPublic: false }),
			conversation({ id: 'invite', isInviteOnly: true }),
			conversation({ id: 'done', isComplete: true }),
			conversation({ id: 'unaddressable', slug: null })
		];

		expect(toDirectory(closed, 'bloomproject.us')).toEqual([]);
	});

	it('orders by Place, then title, with the unplaced last', () => {
		const listed = [
			conversation({ id: 'c3', slug: 'ai', title: 'Somewhere new', metadata: {} }),
			conversation({
				id: 'c2',
				slug: 'housing-dundee',
				title: 'Housing',
				metadata: { place: { slug: 'dundee', name: 'Dundee' } }
			}),
			conversation({
				id: 'c1',
				slug: 'ai-aberdeen',
				title: 'AI',
				metadata: { place: { slug: 'aberdeen', name: 'Aberdeen' } }
			})
		];

		expect(toDirectory(listed, 'bloomproject.us').map((e) => e.id)).toEqual(['c1', 'c2', 'c3']);
	});
});
