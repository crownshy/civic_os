<script lang="ts">
	import type { createApiClient } from '@crownshy/api-client/client';
	import { AudioFormat } from '@crownshy/api-client/api';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import { Progress } from '@civicos/shared/ui/progress';

	type Api = ReturnType<typeof createApiClient>;

	interface Props {
		open: boolean;
		api: Api;
		conversationId: string;
		eventId: string;
		existingNames: string[];
		onUploaded?: () => void;
	}

	let {
		open = $bindable(),
		api,
		conversationId,
		eventId,
		existingNames,
		onUploaded
	}: Props = $props();

	// Derived from the generated API contract (comhairle/open-api-spec.json → AudioFormat enum) so the
	// picker filter and validation stay in sync with the backend automatically. `.oga` is aliased to
	// `ogg` below since some systems report that extension for Ogg audio.
	const SUPPORTED = AudioFormat.options;
	const ACCEPT = [...SUPPORTED.map((f) => `.${f}`), 'audio/*'].join(',');

	let name = $state('');
	let files = $state<FileList | undefined>(undefined);
	let progress = $state(0);
	let submitting = $state(false);
	let nameError = $state<string | null>(null);
	let errorMsg = $state<string | null>(null);

	const selectedFile = $derived(files?.[0] ?? null);

	// Normalise a filename's extension to a supported AudioFormat, or null if unsupported.
	function extractExtension(filename: string): AudioFormat | null {
		const dot = filename.lastIndexOf('.');
		if (dot < 0 || dot === filename.length - 1) return null;
		let ext = filename.slice(dot + 1).toLowerCase();
		if (ext === 'oga') ext = 'ogg';
		return (SUPPORTED as readonly string[]).includes(ext) ? (ext as AudioFormat) : null;
	}

	function uploadToSignedUrl(
		file: File,
		url: string,
		onProgress: (pct: number) => void
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', url, true);
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
			};
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					onProgress(100);
					resolve();
				} else {
					reject(new Error(`Upload failed (${xhr.status})`));
				}
			};
			xhr.onerror = () => reject(new Error('Network error during upload'));
			xhr.send(file);
		});
	}

	function reset() {
		name = '';
		files = undefined;
		progress = 0;
		nameError = null;
		errorMsg = null;
	}

	function close() {
		open = false;
		if (!submitting) reset();
	}

	async function submitForm() {
		errorMsg = null;
		nameError = null;

		const trimmed = name.trim();
		if (trimmed.length === 0) {
			nameError = 'Name is required.';
			return;
		}
		if (existingNames.includes(trimmed)) {
			nameError = 'A recording with that name already exists.';
			return;
		}
		const file = selectedFile;
		if (!file) {
			errorMsg = 'Please choose an audio file to upload.';
			return;
		}
		const fileExtension = extractExtension(file.name);
		if (!fileExtension) {
			errorMsg = `Unsupported file type. Supported formats: ${SUPPORTED.join(', ')}.`;
			return;
		}

		submitting = true;
		progress = 0;
		const params = { conversation_id: conversationId, event_id: eventId };

		try {
			const { recording, uploadUrl } = await api.CreateAudioRecording(
				{ name: trimmed, fileExtension },
				{ params }
			);
			await uploadToSignedUrl(file, uploadUrl, (pct) => (progress = pct));
			await api.ProcessAudioRecording(undefined, {
				params: { ...params, recording_id: recording.id }
			});

			submitting = false;
			reset();
			open = false;
			onUploaded?.();
		} catch (e) {
			submitting = false;
			errorMsg = e instanceof Error ? e.message : 'Upload failed. Please try again.';
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(v) => !v && close()}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Upload New Recording</Dialog.Title>
			<Dialog.Description>
				Name the recording and choose an audio file. It will upload directly, then start
				processing automatically.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="space-y-1.5">
				<Label for="recording-name">Name <span class="text-destructive">*</span></Label>
				<Input
					id="recording-name"
					bind:value={name}
					placeholder="e.g. Breakout Room #1"
					required
					aria-invalid={nameError ? 'true' : undefined}
					aria-describedby={nameError ? 'recording-name-error' : undefined}
					oninput={() => (nameError = null)}
					disabled={submitting}
				/>
				{#if nameError}
					<p id="recording-name-error" class="text-destructive text-caption">{nameError}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Label for="recording-file">Audio file</Label>
				<Input
					id="recording-file"
					type="file"
					accept={ACCEPT}
					bind:files
					disabled={submitting}
				/>
			</div>

			{#if submitting}
				<div class="space-y-1.5">
					<Progress value={progress} />
					<p class="text-caption text-muted-foreground">Uploading… {progress}%</p>
				</div>
			{/if}

			{#if errorMsg}
				<p class="text-destructive text-caption">{errorMsg}</p>
			{/if}
		</div>

		<Dialog.Footer class="gap-2">
			<Button type="button" variant="secondary" onclick={close} disabled={submitting}>Cancel</Button>
			<Button type="button" onclick={submitForm} disabled={submitting}>
				{submitting ? `Uploading… ${progress}%` : 'Upload'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
