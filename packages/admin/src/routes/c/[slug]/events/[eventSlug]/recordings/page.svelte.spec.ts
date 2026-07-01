import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AudioRecordingDto, AudioRecordingStatus } from '@crownshy/api-client/api';
import type { PageData } from './$types';
import Page from './+page.svelte';

// The page calls invalidate() from the polling $effect and after a successful upload; stub it so
// tests don't trigger real navigation.
vi.mock('$app/navigation', () => ({ invalidate: vi.fn(() => Promise.resolve()) }));

function makeData(recordings: AudioRecordingDto[], recordingsFailed: boolean): PageData {
	// we only create the pieces of data that are relevant to the view, but have to cast it to keep the compiler happy.
    // i'd love to find a better way to do this!
	return {
		recordings,
		recordingsFailed,
		eventId: 'event-1',
		region: { conversationId: 'conv-1' },
		api: {
			CreateAudioRecording: vi.fn(),
			ProcessAudioRecording: vi.fn()
		}
	} as unknown as PageData;
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

	it('opens the upload modal when the Upload New Recording button is clicked', async () => {
		render(Page, { props: { data: makeData([], false) } });

		// Modal is closed initially — its description is not rendered.
		await expect
			.element(page.getByText('Name the recording and choose an audio file', { exact: false }))
			.not.toBeInTheDocument();

		await userEvent.click(page.getByRole('button', { name: /upload new recording/i }));

		await expect
			.element(page.getByText('Name the recording and choose an audio file', { exact: false }))
			.toBeInTheDocument();
	});
});
