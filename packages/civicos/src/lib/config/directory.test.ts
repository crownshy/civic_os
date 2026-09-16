import { describe, expect, it, vi } from 'vitest';
import { REGIONS } from '@civicos/shared/data/regions';
import { inPlace, listDirectory, toDirectory, type DirectoryConversation } from './directory';
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

describe('toDirectory', () => {
	it('links a Campaign by its whole Conversation slug, on this host', () => {
		const [entry] = toDirectory([conversation()]);

		expect(entry.href).toBe('/host/conversations/ai-dundee');
		expect(entry.place).toEqual({ slug: 'dundee', name: 'Dundee' });
	});

	it('uses the Host for the org segment when the metadata names one', () => {
		const listed = conversation({
			metadata: { place: { slug: 'dundee', name: 'Dundee' }, org: { name: 'Young Scot' } }
		});

		expect(toDirectory([listed])[0].href).toBe('/young-scot/conversations/ai-dundee');
	});

	it('lists a Campaign with no Place, with no Place on it', () => {
		const listed = conversation({ slug: 'ai', metadata: {} });

		expect(toDirectory([listed])[0]).toMatchObject({
			place: null,
			href: '/host/conversations/ai'
		});
	});

	it('resolves a legacy region through the Conversation it owns', () => {
		const listed = conversation({ id: oregon.conversationId, slug: 'oregon', metadata: {} });
		const [entry] = toDirectory([listed]);

		expect(entry.href).toBe('/host/conversations/oregon');
		expect(entry.place?.slug).toBe(oregon.slug);
	});

	it('leaves out what a stranger cannot join', () => {
		const closed = [
			conversation({ id: 'draft', isLive: false }),
			conversation({ id: 'private', isPublic: false }),
			conversation({ id: 'invite', isInviteOnly: true }),
			conversation({ id: 'done', isComplete: true }),
			conversation({ id: 'unaddressable', slug: null })
		];

		expect(toDirectory(closed)).toEqual([]);
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

		expect(toDirectory(listed).map((e) => e.id)).toEqual(['c1', 'c2', 'c3']);
	});
});

describe('inPlace', () => {
	it('keeps only the Campaigns listed under that Place', () => {
		const entries = toDirectory([
			conversation({ id: 'dundee' }),
			conversation({
				id: 'aberdeen',
				slug: 'ai-aberdeen',
				metadata: { place: { slug: 'aberdeen', name: 'Aberdeen' } }
			}),
			conversation({ id: 'nowhere', slug: 'ai', metadata: {} })
		]);

		expect(inPlace(entries, 'dundee').map((e) => e.id)).toEqual(['dundee']);
		expect(inPlace(entries, 'glasgow')).toEqual([]);
	});
});

describe('listDirectory', () => {
	it('builds the directory from the listed Conversations', async () => {
		const api = {
			ListConverastions: vi.fn().mockResolvedValue({ records: [conversation()], total: 1 })
		};

		expect((await listDirectory(api))?.map((e) => e.id)).toEqual(['c1']);
		expect(api.ListConverastions).toHaveBeenCalledWith({ queries: { limit: 100 } });
	});

	it('answers null, not an empty list, when the list cannot be fetched', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const api = { ListConverastions: vi.fn().mockRejectedValue(new Error('down')) };

		expect(await listDirectory(api)).toBeNull();
	});
});
