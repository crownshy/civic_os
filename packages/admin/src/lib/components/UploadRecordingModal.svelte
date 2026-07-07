<script lang="ts">
	import type { createApiClient } from '@crownshy/api-client/client';
	import { AudioFormat } from '@crownshy/api-client/api';
	import * as Dialog from '@civicos/shared/ui/dialog';
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
	<Dialog.Content class="max-w-[925px] gap-0 rounded-[30px] border-black/30 p-0">
		<div class="p-11">
			<Dialog.Title class="text-4xl font-bold text-yellow-950">
				Name your recording
			</Dialog.Title>

			<!-- Chosen file / picker -->
			<div class="mt-3.5">
				{#if selectedFile}
					<p class="text-2xl font-bold text-yellow-950">{selectedFile.name}</p>
				{:else}
					<Label
						for="recording-file"
						class="inline-flex cursor-pointer items-center gap-2 text-lg font-medium text-red-500"
					>
						Choose an audio file…
					</Label>
				{/if}
				<Input
					id="recording-file"
					type="file"
					accept={ACCEPT}
					bind:files
					disabled={submitting}
					class={selectedFile ? 'sr-only' : 'mt-2'}
				/>
			</div>

			<!-- Name input -->
			<div class="mt-6">
				<input
					id="recording-name"
					bind:value={name}
					placeholder="e.g., Plenary Session"
					required
					aria-invalid={nameError ? 'true' : undefined}
					aria-describedby={nameError ? 'recording-name-error' : undefined}
					oninput={() => (nameError = null)}
					disabled={submitting}
					class="h-16 w-full rounded-[20px] bg-white px-5 text-2xl font-bold text-yellow-950 outline outline-1 outline-stone-500/50 placeholder:text-yellow-950/50 focus:outline-2 focus:outline-red-500 disabled:opacity-50"
				/>
				{#if nameError}
					<p id="recording-name-error" class="mt-1.5 text-caption text-red-500">
						{nameError}
					</p>
				{/if}
			</div>

			{#if submitting}
				<div class="mt-4 space-y-1.5">
					<Progress value={progress} />
					<p class="text-caption text-muted-foreground">Uploading… {progress}%</p>
				</div>
			{/if}

			{#if errorMsg}
				<p class="mt-3 text-caption text-red-500">{errorMsg}</p>
			{/if}

			<!-- Actions -->
			<div class="mt-8 flex justify-end gap-3">
				<button
					type="button"
					onclick={close}
					disabled={submitting}
					class="cursor-pointer rounded-[45px] bg-red-500/10 px-4 py-3 text-xl font-medium leading-6 text-red-500 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={submitForm}
					disabled={submitting}
					class="cursor-pointer rounded-[45px] bg-red-500 px-4 py-3 text-xl font-medium leading-6 text-white disabled:opacity-50"
				>
					{submitting ? `Uploading… ${progress}%` : 'Submit'}
				</button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
