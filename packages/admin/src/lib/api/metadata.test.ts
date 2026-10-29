import { describe, expect, it } from 'vitest';
import { writeMetadata, type MetadataApi } from '@civicos/shared/data/metadata';

// An in-memory Conversation standing in for comhairle, merging a patch at the
// top level the way PatchConversationMetadata does.
function fakeApi(metadata: Record<string, unknown>) {
	const state = { metadata: { ...metadata }, patches: [] as Record<string, unknown>[] };
	const api = {
		GetConversation: async () => ({ metadata: state.metadata }),
		PatchConversationMetadata: async (body: Record<string, unknown>) => {
			state.patches.push(body);
			state.metadata = { ...state.metadata, ...body };
		}
	} as unknown as MetadataApi;
	return { api, state };
}

const POLL = { polisId: 'p1', workflowStepId: 'step-1', question: 'Key question?' };

describe('writeMetadata', () => {
	it('keeps the rest of a stored poll when one field changes', async () => {
		const { api, state } = fakeApi({ poll: POLL });

		await writeMetadata(api, 'c1', { poll: { question: 'New question?' } });

		expect(state.metadata.poll).toEqual({ ...POLL, question: 'New question?' });
	});

	it('does not write a poll that still names no Polis conversation', async () => {
		const { api, state } = fakeApi({});

		await writeMetadata(api, 'c1', { poll: { question: 'Orphan?' } });

		expect(state.patches).toEqual([]);
	});

	it('leaves keys it was not given alone', async () => {
		const { api, state } = fakeApi({ poll: POLL, colorScheme: 'green' });

		await writeMetadata(api, 'c1', { place: { slug: 'utah', name: 'Utah' } });

		expect(state.metadata).toEqual({
			poll: POLL,
			colorScheme: 'green',
			place: { slug: 'utah', name: 'Utah' }
		});
	});

	it('clears a key written as null', async () => {
		const { api, state } = fakeApi({ place: { slug: 'utah', name: 'Utah' } });

		await writeMetadata(api, 'c1', { place: null });

		expect(state.metadata.place).toBeNull();
	});

	it('sends nothing for an empty write', async () => {
		const { api, state } = fakeApi({ poll: POLL });

		await writeMetadata(api, 'c1', {});

		expect(state.patches).toEqual([]);
	});
});
