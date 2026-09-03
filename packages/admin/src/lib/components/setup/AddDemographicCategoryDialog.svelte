<script lang="ts">
	import { ArrowUp, ArrowDown, Pencil, X } from '@lucide/svelte';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import SetupField from './SetupField.svelte';
	import {
		isKeyTaken,
		toDemographicKey,
		type CustomDemographicCategory
	} from '@civicos/shared/data/demographics';

	interface Props {
		open: boolean;
		/** Existing custom categories, for the duplicate-name check. */
		existing: CustomDemographicCategory[];
		onSave: (category: CustomDemographicCategory) => Promise<void>;
	}

	let { open = $bindable(), existing, onSave }: Props = $props();

	let name = $state('');
	let options = $state<string[]>([]);
	/** Index currently open as a text input; -1 when nothing is being edited. */
	let editing = $state(-1);
	let draft = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	const key = $derived(toDemographicKey(name));

	// Withheld until they have started, so an untouched dialog is not already scolding.
	const started = $derived(!!name.trim() || options.length > 0);

	const problem = $derived.by(() => {
		if (!name.trim()) return 'Give the category a name.';
		if (!key) return 'The name needs at least one letter or number.';
		if (isKeyTaken(key, existing)) return 'A category with that name already exists.';
		if (options.length < 2) return 'Add at least two options.';
		if (new Set(options).size !== options.length) return 'Options must be unique.';
		return null;
	});

	// Reset on open, as an event rather than an effect, matching AddCoHostsDialog.
	function onOpenChange(next: boolean) {
		if (next) {
			name = '';
			options = [];
			editing = -1;
			draft = '';
			error = null;
		}
	}

	/** Focus on mount, so an opened editor is ready to type into. */
	function takeFocus(node: HTMLInputElement) {
		node.focus({ preventScroll: true });
		node.select();
		// The wrapper, not the input: otherwise a row opened near the fold leaves its
		// keyboard hint scrolled out of sight.
		node.parentElement?.scrollIntoView({ block: 'nearest' });
	}

	function startAdd() {
		options = [...options, ''];
		editing = options.length - 1;
		draft = '';
	}

	function startEdit(i: number) {
		editing = i;
		draft = options[i];
	}

	/** Commit the open editor. An empty value drops the row rather than keeping a blank. */
	function commit() {
		if (editing < 0) return;
		const value = draft.trim();
		options = value
			? options.map((o, i) => (i === editing ? value : o))
			: options.filter((_, i) => i !== editing);
		editing = -1;
		draft = '';
	}

	// Enter opens the next row so a list can be typed in one run. Enter on a blank
	// row is the "done" gesture: commit() drops it and nothing reopens.
	function commitAndContinue() {
		const hadValue = !!draft.trim();
		commit();
		if (hadValue) startAdd();
	}

	function cancelEdit() {
		// A row added and then abandoned shouldn't linger as an empty entry.
		if (editing >= 0 && !options[editing]) options = options.filter((_, i) => i !== editing);
		editing = -1;
		draft = '';
	}

	function move(i: number, delta: number) {
		const to = i + delta;
		if (to < 0 || to >= options.length) return;
		const next = [...options];
		[next[i], next[to]] = [next[to], next[i]];
		options = next;
	}

	function remove(i: number) {
		options = options.filter((_, idx) => idx !== i);
		if (editing === i) {
			editing = -1;
			draft = '';
		}
	}

	async function save() {
		if (problem || submitting) return;
		submitting = true;
		error = null;
		try {
			await onSave({ key, name: name.trim(), options, enabled: true });
			open = false;
		} catch (e) {
			console.error('Adding a demographic category failed', e);
			error = e instanceof Error ? e.message : 'Could not save the category.';
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content
		class="flex max-h-[85vh] w-[min(92vw,720px)] flex-col overflow-hidden font-ui sm:max-w-[720px]"
	>
		<Dialog.Header class="shrink-0">
			<Dialog.Title class="font-display text-h4 font-semibold md:text-h3">
				Add New Demographic Category
			</Dialog.Title>
			<Dialog.Description class="text-body text-foreground/70">
				Participants pick one option. Categories added here apply across the whole Campaign.
			</Dialog.Description>
		</Dialog.Header>

		<div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
			<div class="flex flex-col gap-8 py-2">
				<SetupField label="Category name">
					<input
						bind:value={name}
						{@attach takeFocus}
						placeholder="e.g. Education Level"
						onkeydown={(e) => {
							if (e.key === 'Enter' && editing < 0) {
								e.preventDefault();
								startAdd();
							}
						}}
						class="w-full rounded-[10px] border border-input bg-background px-4 py-4 text-body-lg font-semibold focus:ring-2 focus:ring-ring focus:outline-none"
					/>
				</SetupField>

				<div>
					<h3 class="font-display text-lg font-medium text-foreground md:text-h4">Options</h3>
					<p class="mt-1 text-body text-foreground/70">
						These are the options that participants will be able to choose from within the category.
					</p>

					<div class="mt-4 divide-y divide-border border-t">
						{#each options as option, i (i)}
							<div class="flex items-center gap-4 py-4">
								{#if editing === i}
									<div class="min-w-0 flex-1">
										<input
											bind:value={draft}
											{@attach takeFocus}
											aria-label={`Option ${i + 1}`}
											aria-describedby="option-editor-hint"
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													commitAndContinue();
												}
												if (e.key === 'Escape') {
													// Otherwise the dialog itself swallows Escape and the whole form is lost.
													e.stopPropagation();
													cancelEdit();
												}
											}}
											onblur={() => {
												// Only for this row: chaining to the next one blurs this input after
												// `editing` has already moved on.
												if (editing === i) commit();
											}}
											class="w-full rounded-[10px] border border-input bg-background px-3 py-2 text-body font-semibold focus:ring-2 focus:ring-ring focus:outline-none"
										/>
										<p id="option-editor-hint" class="mt-1.5 text-caption text-foreground/60">
											<kbd class="font-ui font-semibold">Enter</kbd> saves and opens the next
											option.
											<kbd class="font-ui font-semibold">Esc</kbd> discards it.
										</p>
									</div>
								{:else}
									<span class="min-w-0 flex-1 text-body font-semibold">{option}</span>
									<div class="flex shrink-0 items-center gap-3">
										<button
											type="button"
											onclick={() => move(i, -1)}
											disabled={i === 0}
											aria-label={`Move ${option} up`}
											class="cursor-pointer text-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-25"
										>
											<ArrowUp class="size-4" />
										</button>
										<button
											type="button"
											onclick={() => move(i, 1)}
											disabled={i === options.length - 1}
											aria-label={`Move ${option} down`}
											class="cursor-pointer text-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-25"
										>
											<ArrowDown class="size-4" />
										</button>
										<button
											type="button"
											onclick={() => startEdit(i)}
											aria-label={`Edit ${option}`}
											class="cursor-pointer text-primary"
										>
											<Pencil class="size-4" />
										</button>
										<button
											type="button"
											onclick={() => remove(i)}
											aria-label={`Remove ${option}`}
											class="cursor-pointer text-primary"
										>
											<X class="size-4" />
										</button>
									</div>
								{/if}
							</div>
						{/each}

						<button
							type="button"
							onclick={startAdd}
							disabled={editing >= 0}
							class="w-full cursor-pointer py-4 text-left text-body font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
						>
							Add New…
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-body text-destructive">{error}</p>
				{/if}
			</div>
		</div>

		<Dialog.Footer
			class="shrink-0 items-stretch gap-3 border-t border-border pt-4 sm:items-center sm:justify-between"
		>
			{#if started && problem}
				<p class="min-w-0 text-body text-foreground/70">{problem}</p>
			{/if}
			<div class="flex shrink-0 gap-2 sm:ml-auto">
				<Button variant="secondary" onclick={() => (open = false)} disabled={submitting}>
					Cancel
				</Button>
				<Button onclick={save} disabled={!!problem || submitting}>
					{submitting ? 'Saving…' : 'Save category'}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
