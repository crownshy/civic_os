import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EventTranscriptViewer from './EventTranscriptViewer.svelte';

function renderViewer(overrides: Record<string, unknown> = {}) {
	render(EventTranscriptViewer, {
		props: {
			recordingId: 'rec-1',
			name: 'Rec 1',
			status: 'complete',
			conversationTitle: 'Town Hall',
			audioUrl: 'https://s3.example/audio',
			transcriptionUrl: 'https://s3.example/transcript',
			reportUrl: 'https://s3.example/report',
			recordings: [{ id: 'rec-1', name: 'Rec 1' }],
			basePath: '/c/town-hall/events/e1',
			recordingsPath: '/c/town-hall/events/e1/recordings',
			...overrides
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('EventTranscriptViewer.svelte', () => {
	it('shows the upload-in-progress panel and does not fetch when awaiting_upload', async () => {
		// A recording in `awaiting_upload` has no transcript/report yet, so the fetch
		// effect must short-circuit rather than 404 into the error panel.
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);

		renderViewer({ status: 'awaiting_upload' });

		await expect.element(page.getByText('Upload in progress.')).toBeInTheDocument();
		await expect.element(page.getByText('We have a problem.')).not.toBeInTheDocument();
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
