import { beforeEach, describe, expect, it, vi } from 'vitest';
import { campaignPathFromLegacy, pathFromLegacyRoot } from './legacy-urls';

const GetConversation = vi.fn();
const ListConverastions = vi.fn();
const api = { GetConversation, ListConverastions } as unknown as Parameters<
	typeof pathFromLegacyRoot
>[0];

/** An axios rejection as zodios surfaces it, which is what `httpStatusOf` reads. */
function httpError(status: number) {
	return Object.assign(new Error(`HTTP ${status}`), { response: { status } });
}

/** A live, public Conversation filed under a Place, as the directory lists it. */
function listed(slug: string, place: { slug: string; name: string }) {
	return {
		id: `id-${slug}`,
		slug,
		title: slug,
		isLive: true,
		isPublic: true,
		isInviteOnly: false,
		isComplete: false,
		metadata: { place }
	};
}

describe('campaignPathFromLegacy', () => {
	it('puts the Campaign under /c/', () => {
		expect(campaignPathFromLegacy('ai-utah', '')).toBe('/c/ai-utah');
	});

	it('renames contribute to poll and keeps the rest of the path', () => {
		expect(campaignPathFromLegacy('ai', 'contribute')).toBe('/c/ai/poll');
		expect(campaignPathFromLegacy('ai', 'events/42')).toBe('/c/ai/events/42');
	});
});

describe('pathFromLegacyRoot', () => {
	beforeEach(() => {
		GetConversation.mockReset();
		ListConverastions.mockReset();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	it('sends a page under a slug to the Campaign without asking comhairle', async () => {
		expect(await pathFromLegacyRoot(api, 'ai-utah', 'poll')).toBe('/c/ai-utah/poll');
		expect(GetConversation).not.toHaveBeenCalled();
	});

	it('sends a slug comhairle knows to the Campaign', async () => {
		GetConversation.mockResolvedValue({ id: 'id-ai', slug: 'ai' });

		expect(await pathFromLegacyRoot(api, 'ai', '')).toBe('/c/ai');
		expect(ListConverastions).not.toHaveBeenCalled();
	});

	it('treats a draft as a Campaign, so its Host can still preview it', async () => {
		GetConversation.mockRejectedValue(httpError(403));

		expect(await pathFromLegacyRoot(api, 'draft', '')).toBe('/c/draft');
	});

	it('sends a slug that only names a Place to the Place page', async () => {
		GetConversation.mockRejectedValue(httpError(404));
		ListConverastions.mockResolvedValue({
			records: [listed('ai-dundee', { slug: 'dundee', name: 'Dundee' })]
		});

		expect(await pathFromLegacyRoot(api, 'dundee', '')).toBe('/p/dundee');
	});

	it('sends a slug nothing answers to the Campaign page, which explains the 404', async () => {
		GetConversation.mockRejectedValue(httpError(404));
		ListConverastions.mockResolvedValue({ records: [] });

		expect(await pathFromLegacyRoot(api, 'nothing', '')).toBe('/c/nothing');
	});

	it('keeps a legacy region on its Campaign even when comhairle is down', async () => {
		GetConversation.mockRejectedValue(new Error('ECONNREFUSED'));

		expect(await pathFromLegacyRoot(api, 'utah', '')).toBe('/c/utah');
	});
});
