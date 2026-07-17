<script lang="ts">
	/**
	 * Reusable "add a theme to the dictionary" modal.
	 *
	 * A dumb form: it collects a name + description and validates locally, then
	 * hands off to `onSubmit`. Persistence (the PATCH to the conversation metadata)
	 * lives with the caller, so this modal can be dropped into any theme-management
	 * surface without wiring an API client into it.
	 */
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';

	interface Props {
		open: boolean;
		/** Theme names already in the dictionary — used to reject duplicates. */
		existingNames?: string[];
		/** Persist the new theme. Throws to signal failure (message is surfaced). */
		onSubmit: (theme: { name: string; description: string }) => Promise<void> | void;
	}

	let { open = $bindable(), existingNames = [], onSubmit }: Props = $props();

	let name = $state('');
	let description = $state('');
	let submitting = $state(false);
	let errorMsg = $state<string | null>(null);

	const existingSet = $derived(new Set(existingNames));
	const trimmedName = $derived(name.trim());
	const isDuplicate = $derived(existingSet.has(trimmedName));
	const canSubmit = $derived(!submitting && trimmedName.length > 0 && !isDuplicate);

	function reset() {
		name = '';
		description = '';
		errorMsg = null;
		submitting = false;
	}

	function close() {
		open = false;
		reset();
	}

	// Clear transient state whenever the dialog is dismissed (Esc / overlay click).
	$effect(() => {
		if (!open) reset();
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		submitting = true;
		errorMsg = null;
		try {
			await onSubmit({ name: trimmedName, description: description.trim() });
			close();
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Could not add theme.';
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add theme</Dialog.Title>
			<Dialog.Description>
				Define a theme once for this conversation. Its name and description become
				available everywhere themes are applied.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={submit} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="theme-name">Name</Label>
				<Input id="theme-name" bind:value={name} placeholder="e.g. Housing" autocomplete="off" />
				{#if isDuplicate}
					<p class="text-destructive text-caption">A theme named “{trimmedName}” already exists.</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Label for="theme-description">Description</Label>
				<textarea
					id="theme-description"
					bind:value={description}
					rows="3"
					placeholder="What kinds of statements belong to this theme?"
					class="border-border focus:ring-primary/40 w-full rounded-md border px-3 py-2 text-body focus:ring-2 focus:outline-none"
				></textarea>
			</div>

			{#if errorMsg}
				<p class="text-destructive text-caption">{errorMsg}</p>
			{/if}

			<Dialog.Footer class="gap-2">
				<Button type="button" variant="secondary" onclick={close} disabled={submitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={!canSubmit}>
					{submitting ? 'Adding…' : 'Add theme'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
