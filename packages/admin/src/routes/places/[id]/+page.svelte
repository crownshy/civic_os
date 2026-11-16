<script lang="ts">
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { enhance as enhanceForm } from '$lib/activity.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { AlertCircle, ArrowLeft, CheckCircle2, Trash2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import PlaceFields from '../PlaceFields.svelte';
	import { placeSchema, type PlaceMessage } from '../place-schema';

	let { data, form: actionResult } = $props();

	let saved = $state(false);
	const form = superForm(
		untrack(() => data.form),
		{
			dataType: 'json',
			validators: zod4Client(placeSchema),
			resetForm: false,
			onUpdated({ form }) {
				saved = form.valid && !form.message;
			}
		}
	);
	const { enhance, submitting, message, tainted } = form;

	const msg = $derived($message as PlaceMessage | undefined);
	// Editing again after a save clears the "Saved" line.
	const showSaved = $derived(saved && !$tainted);

	let deleteOpen = $state(false);
	let deleting = $state(false);
	const deleteError = $derived(
		actionResult && 'deleteError' in actionResult ? (actionResult.deleteError as string) : null
	);
</script>

<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-5xl px-6 pt-6 sm:px-8 sm:pt-8">
		<a
			href={resolve('/places')}
			class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			Places
		</a>

		<div class="mb-8 flex items-start justify-between gap-4">
			<h1 class="text-h3 font-bold md:text-h2">{data.place.name}</h1>
			<Button variant="outline" onclick={() => (deleteOpen = true)}>
				<Trash2 class="size-4" />
				Delete
			</Button>
		</div>

		{#if msg?.kind === 'error'}
			<div
				role="alert"
				class="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{msg.text}</span>
			</div>
		{/if}

		<form method="POST" action="?/save" use:enhance novalidate class="flex flex-col gap-6">
			<PlaceFields {form} />

			<div
				class="sticky bottom-0 mt-4 flex items-center gap-3 border-t border-border bg-background py-4"
			>
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Saving…' : 'Save'}
				</Button>
				{#if showSaved}
					<span
						class="inline-flex items-center gap-1.5 text-caption text-success"
						aria-live="polite"
					>
						<CheckCircle2 class="size-4" />
						Saved
					</span>
				{/if}
			</div>
		</form>
	</div>
</div>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Delete "{data.place.name}"?</Dialog.Title>
			<Dialog.Description>
				Its page goes away and conversations stop being listed under it. The conversations
				themselves are not touched. This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		{#if deleteError}
			<p class="text-body text-destructive" role="alert">{deleteError}</p>
		{/if}
		<form
			method="POST"
			action="?/delete"
			use:enhanceForm={() => {
				deleting = true;
				return async ({ update }) => {
					await update();
					deleting = false;
				};
			}}
		>
			<Dialog.Footer class="gap-2">
				<Button
					variant="secondary"
					type="button"
					onclick={() => (deleteOpen = false)}
					disabled={deleting}
				>
					Cancel
				</Button>
				<Button variant="destructive" type="submit" disabled={deleting}>
					{deleting ? 'Deleting…' : 'Delete Place'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
