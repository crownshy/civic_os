import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	clearCampaigns,
	emptyCampaign,
	loadAccount,
	loadCampaign,
	saveAccount,
	saveCampaign
} from './session-storage';

/** Enough of the Storage interface for the module under test. */
class MemoryStorage implements Storage {
	#entries = new Map<string, string>();

	get length() {
		return this.#entries.size;
	}
	key(index: number) {
		return [...this.#entries.keys()][index] ?? null;
	}
	getItem(key: string) {
		return this.#entries.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.#entries.set(key, value);
	}
	removeItem(key: string) {
		this.#entries.delete(key);
	}
	clear() {
		this.#entries.clear();
	}
}

const UTAH = '11111111-1111-1111-1111-111111111111';
const OREGON = '22222222-2222-2222-2222-222222222222';

let store: MemoryStorage;

beforeEach(() => {
	store = new MemoryStorage();
	vi.stubGlobal('localStorage', store);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('campaign records', () => {
	it('keeps two Campaigns on one origin apart', () => {
		saveCampaign(UTAH, { ...emptyCampaign(), pid: 7, totalVotes: 12 });
		saveCampaign(OREGON, { ...emptyCampaign(), pid: 3 });

		expect(loadCampaign(UTAH).pid).toBe(7);
		expect(loadCampaign(UTAH).totalVotes).toBe(12);
		expect(loadCampaign(OREGON).pid).toBe(3);
	});

	it('reads a Campaign it has never stored as a fresh start', () => {
		saveCampaign(UTAH, { ...emptyCampaign(), pid: 7, totalVotes: 12 });

		expect(loadCampaign(OREGON)).toEqual(emptyCampaign());
	});

	it('stores nothing when there is no Conversation to key on', () => {
		saveCampaign('', { ...emptyCampaign(), pid: 7 });

		expect(store.length).toBe(0);
	});

	it('keeps event registrations with the Campaign they belong to', () => {
		saveCampaign(UTAH, { ...emptyCampaign(), registeredEventIds: ['town-hall'] });

		expect(loadCampaign(UTAH).registeredEventIds).toEqual(['town-hall']);
		expect(loadCampaign(OREGON).registeredEventIds).toEqual([]);
	});

	it('reads a malformed registration list as no registrations', () => {
		saveCampaign(UTAH, emptyCampaign());
		const stored = JSON.parse(store.getItem(`civic-os-campaign:${UTAH}`)!);
		store.setItem(
			`civic-os-campaign:${UTAH}`,
			JSON.stringify({ ...stored, registeredEventIds: 'town-hall' })
		);

		expect(loadCampaign(UTAH).registeredEventIds).toEqual([]);
	});
});

describe('schema version', () => {
	it('discards a record written under another version', () => {
		store.setItem(`civic-os-campaign:${UTAH}`, JSON.stringify({ v: 99, pid: 7, totalVotes: 12 }));

		expect(loadCampaign(UTAH)).toEqual(emptyCampaign());
		expect(store.getItem(`civic-os-campaign:${UTAH}`)).toBeNull();
	});

	it('discards a record with no version at all', () => {
		store.setItem('civic-os-account', JSON.stringify({ userId: 'abc', zipCode: '84101' }));

		expect(loadAccount().zipCode).toBe('');
	});

	it('ignores a field of the wrong type rather than passing it on', () => {
		saveCampaign(UTAH, { ...emptyCampaign(), totalVotes: 4 });
		const stored = JSON.parse(store.getItem(`civic-os-campaign:${UTAH}`)!);
		store.setItem(
			`civic-os-campaign:${UTAH}`,
			JSON.stringify({ ...stored, totalVotes: '4', hasSeenPause: 'yes' })
		);

		expect(loadCampaign(UTAH).totalVotes).toBe(0);
		expect(loadCampaign(UTAH).hasSeenPause).toBe(false);
	});
});

describe('clearCampaigns', () => {
	it('drops every Campaign record and keeps the account', () => {
		saveAccount({
			userId: 'abc',
			emailProvided: true,
			zipCode: '84101',
			demographicsCompleted: true,
			hasAgreedToTos: true,
			hasSeenComposeInstructions: false
		});
		saveCampaign(UTAH, { ...emptyCampaign(), pid: 7 });
		saveCampaign(OREGON, { ...emptyCampaign(), pid: 3 });

		clearCampaigns();

		expect(loadCampaign(UTAH)).toEqual(emptyCampaign());
		expect(loadCampaign(OREGON)).toEqual(emptyCampaign());
		expect(loadAccount().zipCode).toBe('84101');
	});
});

describe('migrating the pre-#418 blob', () => {
	const legacy = {
		userId: 'abc',
		emailProvided: true,
		zipCode: '84101',
		demographicsCompleted: true,
		hasAgreedToTos: true,
		hasSeenComposeInstructions: true,
		pid: 7,
		totalVotes: 12,
		hasSeenPause: true,
		endCtaShareCompleted: true,
		endCtaReviewCompleted: false,
		conversationId: UTAH
	};

	it('splits it into an account record and the Campaign it names', () => {
		store.setItem('civic-os-session', JSON.stringify(legacy));

		const account = loadAccount();
		expect(account.userId).toBe('abc');
		expect(account.zipCode).toBe('84101');
		expect(account.hasAgreedToTos).toBe(true);

		const campaign = loadCampaign(UTAH);
		expect(campaign.pid).toBe(7);
		expect(campaign.totalVotes).toBe(12);
		expect(campaign.endCtaShareCompleted).toBe(true);

		expect(store.getItem('civic-os-session')).toBeNull();
	});

	it('keeps the progress half out of every other Campaign', () => {
		store.setItem('civic-os-session', JSON.stringify(legacy));
		loadAccount();

		expect(loadCampaign(OREGON)).toEqual(emptyCampaign());
	});

	it('drops the progress half when the blob names no Conversation', () => {
		const orphan = { ...legacy, conversationId: '' };
		store.setItem('civic-os-session', JSON.stringify(orphan));

		expect(loadAccount().userId).toBe('abc');
		expect(store.length).toBe(1);
	});

	it('does not overwrite records this browser already has', () => {
		saveCampaign(UTAH, { ...emptyCampaign(), pid: 99 });
		store.setItem('civic-os-session', JSON.stringify(legacy));

		loadAccount();

		expect(loadCampaign(UTAH).pid).toBe(99);
	});

	it('leaves a versioned blob alone, since only the old shape is unversioned', () => {
		store.setItem('civic-os-session', JSON.stringify({ ...legacy, v: 1 }));

		expect(loadAccount().userId).toBeUndefined();
		expect(loadCampaign(UTAH)).toEqual(emptyCampaign());
	});

	it('survives a blob that is not an object', () => {
		store.setItem('civic-os-session', '"nope"');

		expect(loadAccount()).toEqual({
			userId: undefined,
			emailProvided: false,
			zipCode: '',
			demographicsCompleted: false,
			hasAgreedToTos: false,
			hasSeenComposeInstructions: false
		});
		expect(store.getItem('civic-os-session')).toBeNull();
	});
});
