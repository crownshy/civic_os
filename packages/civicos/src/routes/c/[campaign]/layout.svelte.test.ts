import { createRawSnippet } from 'svelte';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createApiClient } from '@civicos/shared/api';
import { resolveCampaign } from '$lib/config/campaign';
import { resolveParticipation } from '$lib/config/participation';
import { GENERIC_REGION } from '$lib/config/regions';
import { joinContextFor } from '$lib/services/join';
import type { LayoutData } from './$types';
import Layout from './+layout.svelte';

it('keeps a draft within a Campaign but resets it when the Campaign or preview changes', async () => {
	const children = createRawSnippet(() => ({
		render: () => '<input aria-label="Draft answer" />'
	}));
	const api = createApiClient('http://localhost/api', undefined, 'client');
	const campaign = resolveCampaign({ id: 'first', title: 'First Campaign' }, GENERIC_REGION);
	const data: LayoutData = {
		api,
		campaign,
		preview: false,
		previewOrganizationId: null,
		colorScheme: null,
		participant: null,
		participantResolved: true,
		knownParticipant: { userId: null, zipCode: '', isReturning: false },
		joinContext: joinContextFor({ api, campaign, preview: false }),
		shareUrl: 'http://localhost/c/first',
		hostCopy: { context: '', whatsNext: '' },
		faq: [],
		participation: resolveParticipation(null),
		pollStatus: 'live'
	};
	const screen = await render(Layout, { data, children });
	const answer = page.getByLabelText('Draft answer');

	await answer.fill('First Campaign answer');
	await screen.rerender({ data: { ...data } });
	await expect.element(answer).toHaveValue('First Campaign answer');

	await screen.rerender({ data: { ...data, campaign: { ...campaign, id: 'second' } } });
	await expect.element(answer).toHaveValue('');

	await answer.fill('Live answer');
	await screen.rerender({
		data: { ...data, campaign: { ...campaign, id: 'second' }, preview: true }
	});
	await expect.element(answer).toHaveValue('');
});
