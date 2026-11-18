<script lang="ts">
	import { failureMessage } from '$lib/api/describe-failure';
	import CharCount from '$lib/components/CharCount.svelte';
	import { ArrowUp, ArrowDown, Pencil, X } from '@lucide/svelte';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import * as Form from '@civicos/shared/ui/form';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { untrack } from 'svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import {
		cleanOptionLabel,
		findRepeatedOption,
		repeatedOptionIndexes,
		type CustomDemographicCategory
	} from '@civicos/shared/data/demographics';

	interface Props {
		open: boolean;
		/** Present when changing an existing category. Its id remains stable. */
		category?: CustomDemographicCategory;
		/** Every question the card lists, for the duplicate-name check. */
		existing: CustomDemographicCategory[];
		onSave: (category: CustomDemographicCategory) => Promise<void>;
	}

	let { open = $bindable(), category, existing, onSave }: Props = $props();

	const schema = z
		.object({
			name: z.string().refine((value) => !!value.trim(), 'Give the category a name.'),
			options: z.array(z.string())
		})
		.superRefine(({ name, options }, ctx) => {
			const wanted = name.trim().toLowerCase();
			if (
				wanted &&
				existing.some(
					(other) => other.id !== category?.id && other.displayName.trim().toLowerCase() === wanted
				)
			) {
				ctx.addIssue({ code: 'custom', path: ['name'], message: 'A category with that name already exists.' });
			}
			if (category?.answerFormat) return;
			if (options.length < 2)
				ctx.addIssue({ code: 'custom', path: ['options'], message: 'Add at least two options.' });
			if (options.length > TEXT_LIMITS.demographicOptionCount)
				ctx.addIssue({
					code: 'custom',
					path: ['options'],
					message: `Keep it to ${TEXT_LIMITS.demographicOptionCount} options or fewer.`
				});
			if (repeatedOptionIndexes(options).size > 0)
				ctx.addIssue({ code: 'custom', path: ['options'], message: 'Options must be unique.' });
		});
	const form = superForm(
		defaults(
			untrack(() => ({
				name: category?.displayName ?? '',
				options: [...(category?.options ?? [])]
			})),
			zod4(schema)
		),
		{ SPA: true, validators: zod4Client(schema) }
	);
	const { form: formData, reset, validateForm } = form;
	/** Index currently open as a text input; -1 when nothing is being edited. */
	let editing = $state(-1);
	let draft = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	/** The option the open editor's text already matches, flagged as they type. */
	const draftRepeats = $derived(
		editing >= 0 ? findRepeatedOption(draft, $formData.options, editing) : undefined
	);
	const repeats = $derived(repeatedOptionIndexes($formData.options));

	// Withheld until they have started, so an untouched dialog is not already scolding.
	const started = $derived(!!$formData.name.trim() || $formData.options.length > 0);
	const validationOptions = $derived(
		editing < 0
			? $formData.options
			: $formData.options.flatMap((option, i) =>
					i !== editing ? [option] : draft.trim() ? [cleanOptionLabel(draft)] : []
				)
	);
	const validation = $derived(schema.safeParse({ name: $formData.name, options: validationOptions }));
	const nameProblem = $derived(
		validation.success ? undefined : validation.error.issues.find((issue) => issue.path[0] === 'name')?.message
	);
	const optionsProblem = $derived(
		validation.success
			? undefined
			: validation.error.issues.find((issue) => issue.path[0] === 'options')?.message
	);
	const problem = $derived(
		draftRepeats ? 'Change or discard the repeated option.' : nameProblem ?? optionsProblem
	);

	// Reset on open, as an event rather than an effect, matching AddCoHostsDialog.
	function onOpenChange(next: boolean) {
		if (next) {
			reset({
				data: {
					name: category?.displayName ?? '',
					options: [...(category?.options ?? [])]
				}
			});
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

	const full = $derived($formData.options.length >= TEXT_LIMITS.demographicOptionCount);

	function startAdd() {
		if (full) return;
		$formData.options = [...$formData.options, ''];
		editing = $formData.options.length - 1;
		draft = '';
	}

	function startEdit(i: number) {
		editing = i;
		draft = $formData.options[i];
	}

	/**
	 * Commit the open editor. An empty value drops the row rather than keeping a blank;
	 * a repeat keeps the editor open with its warning. Returns whether the row closed.
	 */
	function commit(): boolean {
		if (editing < 0) return true;
		if (draftRepeats) return false;
		const value = cleanOptionLabel(draft);
		$formData.options = value
			? $formData.options.map((o, i) => (i === editing ? value : o))
			: $formData.options.filter((_, i) => i !== editing);
		editing = -1;
		draft = '';
		return true;
	}

	// Enter opens the next row so a list can be typed in one run. Enter on a blank
	// row is the "done" gesture: commit() drops it and nothing reopens.
	function commitAndContinue() {
		const hadValue = !!draft.trim();
		if (commit() && hadValue) startAdd();
	}

	function cancelEdit() {
		// A row added and then abandoned shouldn't linger as an empty entry.
		if (editing >= 0 && !$formData.options[editing])
			$formData.options = $formData.options.filter((_, i) => i !== editing);
		editing = -1;
		draft = '';
	}

	function move(i: number, delta: number) {
		const to = i + delta;
		if (to < 0 || to >= $formData.options.length) return;
		const next = [...$formData.options];
		[next[i], next[to]] = [next[to], next[i]];
		$formData.options = next;
	}

	function remove(i: number) {
		$formData.options = $formData.options.filter((_, idx) => idx !== i);
		if (editing === i) {
			editing = -1;
			draft = '';
		}
	}

	async function save() {
		if (problem || submitting) return;
		if (!commit()) return;
		submitting = true;
		error = null;
		try {
			const result = await validateForm({ update: true });
			if (!result.valid) return;
			await onSave({
				...category,
				id: category?.id ?? '',
				displayName: result.data.name.trim(),
				options: result.data.options,
				enabled: category?.enabled ?? true
			});
			open = false;
		} catch (e) {
			console.error('Adding a demographic category failed', e);
			error = failureMessage(e, 'Could not save the category.');
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
				{category ? 'Edit Demographic Category' : 'Add New Demographic Category'}
			</Dialog.Title>
			<Dialog.Description class="text-body text-foreground/70">
				{#if category?.answerFormat}
					Participants provide a {category.answerFormat.toLowerCase()} answer.
				{:else if category?.multipleSelection}
					Participants can select multiple options.
				{:else}
					Participants pick one option.
				{/if}
				Categories added here apply across the whole Campaign.
			</Dialog.Description>
		</Dialog.Header>

		<div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
			<div class="flex flex-col gap-8 py-2">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<div class="min-w-0 space-y-1.5">
								<Form.Label class="font-ui text-caption font-semibold tracking-tight text-muted-foreground uppercase">
									Category name
								</Form.Label>
								<Input
									{...props}
									bind:value={$formData.name}
									maxlength={TEXT_LIMITS.demographicName}
									{@attach takeFocus}
									placeholder="e.g. Education Level"
									aria-invalid={started && !!nameProblem}
									aria-describedby={started && nameProblem ? 'category-name-error' : undefined}
									onkeydown={(e) => {
										if (e.key === 'Enter' && editing < 0 && !category?.answerFormat) {
											e.preventDefault();
											startAdd();
										}
									}}
									class="h-auto w-full rounded-[10px] border border-input bg-background px-4 py-4 text-body-lg font-semibold focus:ring-2 focus:ring-ring focus:outline-none"
								/>
								<CharCount count={$formData.name.length} limit={TEXT_LIMITS.demographicName} class="mt-1" />
								{#if started && nameProblem}
									<p id="category-name-error" class="text-caption text-destructive">{nameProblem}</p>
								{/if}
							</div>
						{/snippet}
					</Form.Control>
				</Form.Field>

				{#if !category?.answerFormat}
				<div>
					<h3 class="font-display text-lg font-medium text-foreground md:text-h4">Options</h3>
					<p class="mt-1 text-body text-foreground/70">
						These are the options that participants will be able to choose from within the category.
					</p>

					<div class="mt-4 divide-y divide-border border-t">
						{#each $formData.options as option, i (i)}
							<div class="flex items-center gap-4 py-4">
								{#if editing === i}
									<div class="min-w-0 flex-1">
										<input
											bind:value={draft}
											maxlength={TEXT_LIMITS.demographicOption}
											{@attach takeFocus}
											aria-label={`Option ${i + 1}`}
											aria-describedby="option-editor-hint"
											aria-invalid={!!draftRepeats}
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
											class="w-full rounded-[10px] border border-input bg-background px-3 py-2 text-body font-semibold focus:ring-2 focus:ring-ring focus:outline-none aria-invalid:border-destructive"
										/>
										<CharCount
											count={draft.length}
											limit={TEXT_LIMITS.demographicOption}
											class="mt-1"
										/>
										{#if draftRepeats}
											<p id="option-editor-hint" class="mt-1.5 text-caption text-destructive">
												Already an option as “{draftRepeats}”.
												<kbd class="font-ui font-semibold">Esc</kbd> discards it.
											</p>
										{:else}
											<p id="option-editor-hint" class="mt-1.5 text-caption text-foreground/60">
												<kbd class="font-ui font-semibold">Enter</kbd> saves and opens the next
												option.
												<kbd class="font-ui font-semibold">Esc</kbd> discards it.
											</p>
										{/if}
									</div>
								{:else}
									<div class="min-w-0 flex-1">
										<span class="text-body font-semibold">{option}</span>
										{#if repeats.has(i)}
											<p class="mt-0.5 text-caption text-destructive">Repeats an option above.</p>
										{/if}
									</div>
									<div class="flex shrink-0 items-center gap-3">
										<button
											type="button"
											onclick={() => move(i, -1)}
											disabled={i === 0}
											aria-label={`Move ${option} up`}
											class="cursor-pointer touch-manipulation text-foreground transition-all hover:text-primary active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-25 disabled:active:scale-100"
										>
											<ArrowUp class="size-4" />
										</button>
										<button
											type="button"
											onclick={() => move(i, 1)}
											disabled={i === $formData.options.length - 1}
											aria-label={`Move ${option} down`}
											class="cursor-pointer touch-manipulation text-foreground transition-all hover:text-primary active:scale-90 active:text-primary/70 active:duration-0 disabled:cursor-not-allowed disabled:opacity-25 disabled:active:scale-100"
										>
											<ArrowDown class="size-4" />
										</button>
										<button
											type="button"
											onclick={() => startEdit(i)}
											aria-label={`Edit ${option}`}
											class="cursor-pointer touch-manipulation text-primary transition-all hover:text-primary/80 active:scale-90 active:text-primary/70 active:duration-0"
										>
											<Pencil class="size-4" />
										</button>
										<button
											type="button"
											onclick={() => remove(i)}
											aria-label={`Remove ${option}`}
											class="cursor-pointer touch-manipulation text-primary transition-all hover:text-primary/80 active:scale-90 active:text-primary/70 active:duration-0"
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
							disabled={editing >= 0 || full}
							class="w-full cursor-pointer py-4 text-left text-body font-semibold text-primary transition-opacity hover:opacity-80 active:opacity-60 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Add New…
						</button>
					</div>
					{#if started && optionsProblem && !draftRepeats}
						<p class="mt-1 text-caption text-destructive">{optionsProblem}</p>
					{/if}
				</div>
				{/if}

				{#if error}
					<p class="text-body text-destructive">{error}</p>
				{/if}
			</div>
		</div>

		<Dialog.Footer
			class="shrink-0 items-stretch gap-3 border-t border-border pt-4 sm:items-center sm:justify-between"
		>
			<div class="flex shrink-0 gap-2 sm:ml-auto">
				<Button variant="secondary" onclick={() => (open = false)} disabled={submitting}>
					Cancel
				</Button>
				<Button
					onmousedown={(event) => {
						// Blur would close the option editor and move this button before the click.
						if (editing >= 0) event.preventDefault();
					}}
					onclick={save}
					disabled={!!problem || submitting}
				>
					{submitting ? 'Saving…' : category ? 'Save changes' : 'Save category'}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
