import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UploadRecordingModal from './UploadRecordingModal.svelte';

// Fake XMLHttpRequest so the direct-to-S3 PUT resolves without a real network call, while still
// driving the progress + onload callbacks the component relies on. Declared at module scope so the
// svelte compiler doesn't flag a nested class in this `.svelte.spec` file.
class FakeXHR {
	static lastSent: { method?: string; url?: string } = {};
	upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } =
		{};
	status = 200;
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	open(method: string, url: string) {
		FakeXHR.lastSent = { method, url };
	}
	send() {
		this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
		this.upload.onprogress?.({ lengthComputable: true, loaded: 10, total: 10 });
		this.onload?.();
	}
}

function makeApi(overrides: Record<string, unknown> = {}) {
	return {
		CreateAudioRecording: vi.fn().mockResolvedValue({
			recording: { id: 'rec-1' },
			uploadUrl: 'https://s3.example/upload'
		}),
		ProcessAudioRecording: vi.fn().mockResolvedValue({ jobId: 'job-1', message: 'ok' }),
		...overrides
	};
}

function renderModal(
	props: { existingNames?: string[]; api?: ReturnType<typeof makeApi> } = {}
) {
	const api = props.api ?? makeApi();
	const onUploaded = vi.fn();
	render(UploadRecordingModal, {
		props: {
			open: true,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			api: api as any,
			conversationId: 'conv-1',
			eventId: 'event-1',
			existingNames: props.existingNames ?? [],
			onUploaded
		}
	});
	return { api, onUploaded };
}

const nameField = () => page.getByRole('textbox', { name: /name/i });
const fileField = () => page.getByLabelText('Audio file');
const uploadButton = () => page.getByRole('button', { name: 'Upload' });

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('UploadRecordingModal.svelte', () => {
	it('blocks submit and shows a field error when the name is empty', async () => {
		const { api } = renderModal();

		await userEvent.click(uploadButton());

		await expect.element(page.getByText('Name is required.')).toBeInTheDocument();
		expect(api.CreateAudioRecording).not.toHaveBeenCalled();
	});

	it('clears the name error once the user types', async () => {
		renderModal();

		await userEvent.click(uploadButton());
		await expect.element(page.getByText('Name is required.')).toBeInTheDocument();

		await userEvent.fill(nameField(), 'Morning session');

		await expect.element(page.getByText('Name is required.')).not.toBeInTheDocument();
	});

	it('rejects a name that already exists', async () => {
		const { api } = renderModal({ existingNames: ['Plenary'] });

		await userEvent.fill(nameField(), 'Plenary');
		await userEvent.click(uploadButton());

		await expect
			.element(page.getByText('A recording with that name already exists.'))
			.toBeInTheDocument();
		expect(api.CreateAudioRecording).not.toHaveBeenCalled();
	});

	it('rejects an unsupported file type', async () => {
		const { api } = renderModal();

		await userEvent.fill(nameField(), 'Notes');
		await userEvent.upload(fileField(), new File(['x'], 'notes.txt', { type: 'text/plain' }));
		await userEvent.click(uploadButton());

		await expect.element(page.getByText('Unsupported file type', { exact: false })).toBeInTheDocument();
		expect(api.CreateAudioRecording).not.toHaveBeenCalled();
	});

	it('creates the recording, uploads to S3, starts processing, and reports success', async () => {
		FakeXHR.lastSent = {};
		vi.stubGlobal('XMLHttpRequest', FakeXHR);

		const { api, onUploaded } = renderModal();
		const file = new File([new Uint8Array([1, 2, 3])], 'clip.mp3', { type: 'audio/mpeg' });

		await userEvent.fill(nameField(), 'Morning session');
		await userEvent.upload(fileField(), file);
		await userEvent.click(uploadButton());

		await expect.poll(() => api.ProcessAudioRecording.mock.calls.length).toBe(1);

		expect(api.CreateAudioRecording).toHaveBeenCalledWith(
			{ name: 'Morning session', fileExtension: 'mp3' },
			{ params: { conversation_id: 'conv-1', event_id: 'event-1' } }
		);
		expect(FakeXHR.lastSent.method).toBe('PUT');
		expect(FakeXHR.lastSent.url).toBe('https://s3.example/upload');
		expect(api.ProcessAudioRecording).toHaveBeenCalledWith(undefined, {
			params: { conversation_id: 'conv-1', event_id: 'event-1', recording_id: 'rec-1' }
		});
		expect(onUploaded).toHaveBeenCalledTimes(1);
	});
});
