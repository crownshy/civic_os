<script lang="ts">
	import { ArrowUp, ArrowDown, Pencil, X } from '@lucide/svelte';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import SetupField from './SetupField.svelte';
	import {
		isKeyTaken,
		toDemographicKey,
		type CustomDemographicCategory
	} from '$lib/config/demographics';

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
	<Dialog.Content class="font-ui max-h-[85vh] w-[min(92vw,720px)] overflow-y-auto sm:max-w-[720px]">
		<Dialog.Header>
			<Dialog.Title class="font-display md:text-h3 text-h4 font-semibold">
				Add New Demographic Category
			</Dialog.Title>
			<Dialog.Description class="text-foreground/70 text-body">
				Participants pick one option. Categories added here apply across the whole Campaign.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-8 py-2">
			<SetupField label="Category name">
				<input
					bind:value={name}
					placeholder="e.g. Education Level"
					class="border-input bg-background text-body-lg focus:ring-ring w-full rounded-[10px] border px-4 py-4 font-semibold focus:ring-2 focus:outline-none"
				/>
			</SetupField>

			<div>
				<h3 class="font-display md:text-h4 text-foreground text-lg font-medium">Options</h3>
				<p class="text-foreground/70 text-body mt-1">
					These are the options that participants will be able to choose from within the category.
				</p>

				<div class="divide-border mt-4 divide-y border-t">
					{#each options as option, i (i)}
						<div class="flex items-center gap-4 py-4">
							{#if editing === i}
								<!-- svelte-ignore a11y_autofocus -->
								<input
									bind:value={draft}
									autofocus
									aria-label={`Option ${i + 1}`}
									onkeydown={(e) => {
										if (e.key === 'Enter') commit();
										if (e.key === 'Escape') cancelEdit();
									}}
									onblur={commit}
									class="border-input bg-background text-body focus:ring-ring min-w-0 flex-1 rounded-[10px] border px-3 py-2 font-semibold focus:ring-2 focus:outline-none"
								/>
							{:else}
								<span class="text-body min-w-0 flex-1 font-semibold">{option}</span>
								<div class="flex shrink-0 items-center gap-3">
									<button
										type="button"
										onclick={() => move(i, -1)}
										disabled={i === 0}
										aria-label={`Move ${option} up`}
										class="text-foreground hover:text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-25"
									>
										<ArrowUp class="size-4" />
									</button>
									<button
										type="button"
										onclick={() => move(i, 1)}
										disabled={i === options.length - 1}
										aria-label={`Move ${option} down`}
										class="text-foreground hover:text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-25"
									>
										<ArrowDown class="size-4" />
									</button>
									<button
										type="button"
										onclick={() => startEdit(i)}
										aria-label={`Edit ${option}`}
										class="text-primary cursor-pointer"
									>
										<Pencil class="size-4" />
									</button>
									<button
										type="button"
										onclick={() => remove(i)}
										aria-label={`Remove ${option}`}
										class="text-primary cursor-pointer"
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
						class="text-primary text-body w-full cursor-pointer py-4 text-left font-semibold disabled:cursor-not-allowed disabled:opacity-50"
					>
						Add New…
					</button>
				</div>
			</div>

			{#if error}
				<p class="text-destructive text-body">{error}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (open = false)} disabled={submitting}>
				Cancel
			</Button>
			<Button onclick={save} disabled={!!problem || submitting} title={problem ?? undefined}>
				{submitting ? 'Saving…' : 'Save category'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
