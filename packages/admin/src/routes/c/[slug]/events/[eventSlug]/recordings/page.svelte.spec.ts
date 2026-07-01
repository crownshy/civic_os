import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AudioRecordingDto, AudioRecordingStatus } from '@crownshy/api-client/api';
import type { PageData } from './$types';
import Page from './+page.svelte';

function makeData(recordings: AudioRecordingDto[], recordingsFailed: boolean): PageData {
    // we only create the pieces of data that are relevant to the view, but have to cast it to keep the compiler happy.
    // i'd love to find a better way to do this!
	return { recordings, recordingsFailed } as unknown as PageData;
}

function makeRecording(
	name: string,
	status: AudioRecordingStatus,
	id = name.toLowerCase().replace(/\s+/g, '-')
): AudioRecordingDto {
	return {
		id,
		name,
		status,
		fileExtension: 'mp3',
		eventId: 'event-1',
		s3KeyPrefix: `recordings/${id}`,
		createdAt: '2026-06-30T12:00:00.000Z',
		updatedAt: '2026-06-30T12:00:00.000Z'
	};
}

describe('recordings /+page.svelte', () => {
	it('shows the error card when loading failed', async () => {
		render(Page, { props: { data: makeData([], true) } });

		await expect
			.element(page.getByText("Couldn't load recordings", { exact: false }))
			.toBeInTheDocument();
	});

	it('shows the empty state when there are no recordings', async () => {
		render(Page, { props: { data: makeData([], false) } });

		await expect.element(page.getByText('No recordings yet', { exact: false })).toBeInTheDocument();
	});

	it('renders a card with name and status pill for each recording', async () => {
		const recordings = [
			makeRecording('Plenary', 'complete'),
			makeRecording('Breakout 1', 'transcribing')
		];
		render(Page, { props: { data: makeData(recordings, false) } });

		await expect.element(page.getByText('Plenary')).toBeInTheDocument();
		await expect.element(page.getByText('Breakout 1')).toBeInTheDocument();
		// Status-pill labels come from statusLabel()/statusTone() — the component's real logic.
		await expect.element(page.getByText('complete')).toBeInTheDocument();
		await expect.element(page.getByText('transcribing')).toBeInTheDocument();
	});
});
