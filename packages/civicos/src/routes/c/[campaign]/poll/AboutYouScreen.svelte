<script lang="ts">
	import { untrack } from 'svelte';
	import { fromAction } from 'svelte/attachments';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { Input } from '@civicos/shared/ui/input';
	import * as Form from '@civicos/shared/ui/form';
	import { Check, Plus } from '@lucide/svelte';
	import { InfoBar, Button, Dialog, Link, AlertBanner } from '$lib/components/ui';
	import type {
		AboutYouQuestion,
		AnswerDraft,
		AnswerDrafts,
		SaveAnswersResult
	} from '$lib/services/demographics';
	import { answerSchema } from './answer-schema';

	interface Props {
		placeName: string;
		questions: AboutYouQuestion[];
		onDone: (answers: AnswerDrafts, alreadySaved: string[]) => Promise<SaveAnswersResult>;
	}

	let { placeName, questions, onDone }: Props = $props();
	let saving = $state(false);
	let failure = $state<'conflict' | 'save' | null>(null);
	let savedVersions = $state<string[]>([]);
	let conflictingVersions = $state<string[]>([]);
	let openDialog = $state<string | null>(null);
	const dialogQuestion = $derived(questions.find((question) => question.version.id === openDialog));
	const schema = untrack(() => answerSchema(questions));
	const initial = untrack(() => ({
		answers: Object.fromEntries(
			questions.map((question) => [question.version.id, { ...question.initial }])
		)
	}));
	const form = superForm(defaults(initial, zod4(schema)), {
		SPA: true,
		dataType: 'json',
		applyAction: false,
		invalidateAll: false,
		validators: zod4Client(schema),
		taintedMessage: false,
		resetForm: false,
		onUpdate: ({ form: submitted }) => {
			if (submitted.valid) void handleContinue(submitted.data.answers);
		}
	});
	const { form: fields, enhance } = form;

	async function handleContinue(answers: AnswerDrafts) {
		if (saving) return;
		saving = true;
		failure = null;
		try {
			const result = await onDone(answers, savedVersions);
			savedVersions = [...new Set([...savedVersions, ...result.saved])];
			if (result.conflict) conflictingVersions = [...conflictingVersions, result.conflict];
			if (!result.success) failure = result.conflict ? 'conflict' : 'save';
		} catch (error) {
			console.error('[About You] Could not finish saving answers:', error);
			failure = 'save';
		} finally {
			saving = false;
		}
	}

	function selectOption(question: AboutYouQuestion, optionId: string) {
		const draft = $fields.answers[question.version.id];
		if (question.version.question_type === 'single_select') {
			$fields.answers[question.version.id] = {
				...draft,
				preferNotToSay: false,
				optionIds: [optionId],
				other: false,
				otherText: ''
			};
		} else {
			$fields.answers[question.version.id] = {
				...draft,
				preferNotToSay: false,
				optionIds: draft.optionIds.includes(optionId)
					? draft.optionIds.filter((id) => id !== optionId)
					: [...draft.optionIds, optionId]
			};
		}
	}

	function selectOther(question: AboutYouQuestion) {
		const draft = $fields.answers[question.version.id];
		const other = question.version.question_type === 'single_select' || !draft.other;
		$fields.answers[question.version.id] = {
			...draft,
			preferNotToSay: false,
			other,
			otherText: other ? draft.otherText : '',
			optionIds: question.version.question_type === 'single_select' ? [] : draft.optionIds
		};
	}

	function selectPreferNotToSay(question: AboutYouQuestion) {
		const draft = $fields.answers[question.version.id];
		$fields.answers[question.version.id] = {
			...draft,
			preferNotToSay: !draft.preferNotToSay,
			optionIds: [],
			other: false,
			otherText: ''
		};
	}

	function clearAnswer(question: AboutYouQuestion) {
		$fields.answers[question.version.id] = {
			value: '',
			optionIds: [],
			other: false,
			otherText: '',
			preferNotToSay: false,
			consent: false
		};
	}

	function selectionLabel(question: AboutYouQuestion): string {
		if (conflictingVersions.includes(question.version.id)) return '';
		const draft: AnswerDraft = $fields.answers[question.version.id];
		if (draft.preferNotToSay) return 'Prefer not to say';
		const labels = question.version.options
			.filter((option) => draft.optionIds.includes(option.id))
			.map((option) => option.label);
		if (draft.other && draft.otherText.trim()) labels.push(draft.otherText.trim());
		return labels.join(', ') || draft.value;
	}

	function dateInputType(version: AboutYouQuestion['version']): 'date' | 'month' | 'text' {
		if (version.question_type !== 'date') return 'text';
		if (version.date_precision === 'day') return 'date';
		if (version.date_precision === 'month') return 'month';
		return 'text';
	}

	function dateLabel(version: AboutYouQuestion['version']): string {
		if (version.date_precision === 'year') return 'Year (YYYY)';
		if (version.date_precision === 'month') return 'Month and year';
		return 'Date';
	}
</script>

<form
	{@attach fromAction(enhance)}
	method="POST"
	novalidate
	class="flex h-full flex-col bg-background"
>
	<InfoBar {placeName} />

	<div class="flex flex-1 flex-col overflow-y-auto px-6 pt-8">
		<span
			class="font-mono text-base font-medium text-foreground/80"
			in:fly={{ y: -10, duration: 300, delay: 100, easing: cubicOut }}>BEFORE YOU GO...</span
		>
		<p
			class="mt-4 font-display text-4xl leading-9 font-medium tracking-display text-foreground"
			in:fly={{ y: 10, duration: 400, delay: 200, easing: cubicOut }}
		>
			Help {placeName} see itself.
		</p>
		<p class="mt-3 font-sans text-base font-medium text-foreground">
			This conversation is richer when it reflects the full range of {placeName}. Sharing a little
			about yourself helps the whole community see who's in this conversation and whose voices might
			still be missing.
		</p>
		<p class="mt-3 font-sans text-base font-medium text-foreground">
			Share what you're comfortable with. Required questions are marked below.
		</p>
		<p class="mt-3 font-sans text-base font-medium text-foreground">
			See our full privacy terms <Link
				href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1"
				external>here</Link
			>.
		</p>

		<div class="mt-8 flex flex-col gap-3 pb-12">
			{#each questions as question, index (question.version.id)}
				<Form.Field {form} name={`answers.${question.version.id}.value`}>
					<button
						type="button"
						disabled={savedVersions.includes(question.version.id)}
						onclick={() => (openDialog = question.version.id)}
						class="relative flex min-h-16 w-full touch-manipulation items-center rounded-[20px] bg-secondary/10 px-6 py-3 pr-16 text-left font-sans text-lg font-bold text-foreground transition-colors hover:bg-secondary/15 disabled:opacity-70"
						in:fly={{ y: 15, delay: 400 + index * 80, duration: 400, easing: cubicOut }}
					>
						<span class="flex flex-col">
							<span>{question.version.text}{question.required ? ' (required)' : ''}</span>
							{#if selectionLabel(question)}
								<span class="text-base font-medium">{selectionLabel(question)}</span>
							{/if}
							{#if savedVersions.includes(question.version.id)}
								<span class="text-base font-medium">
									{conflictingVersions.includes(question.version.id)
										? 'Already submitted'
										: 'Saved'}
								</span>
							{/if}
						</span>
						<span
							class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/40"
						>
							{#if selectionLabel(question) || savedVersions.includes(question.version.id)}
								<Check class="h-3.5 w-3.5 stroke-3 text-card" />
							{:else}
								<Plus class="h-3 w-3 stroke-3 text-accent" />
							{/if}
						</span>
					</button>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name={`answers.${question.version.id}.consent`}>
					<Form.FieldErrors />
				</Form.Field>
			{/each}
		</div>
	</div>

	<div class="flex shrink-0 flex-col gap-3 px-7 py-8">
		{#if failure}
			<AlertBanner
				message={failure === 'conflict'
					? 'An answer was already submitted for this Campaign and cannot be changed. Continue to save any remaining answers.'
					: "Some answers didn't save. Saved answers are locked. Please try again."}
			/>
		{/if}
		<Button type="submit" variant="primary" fullWidth disabled={saving}>
			{saving ? 'SAVING...' : 'CONTINUE'}
		</Button>
	</div>
</form>

{#if dialogQuestion}
	{@const question = dialogQuestion}
	{@const version = question.version}
	{@const draft = $fields.answers[version.id]}
	<Dialog
		open={true}
		title={version.text}
		description={question.required ? 'Required' : 'Optional'}
		buttonText="DONE"
		onButtonClick={() => (openDialog = null)}
		onOpenChange={(open) => {
			if (!open) openDialog = null;
		}}
	>
		<div class="mt-6 px-7">
			<Form.Field {form} name={`answers.${version.id}.value`}>
				<Form.Control>
					{#snippet children({ props })}
						{#if version.question_type === 'single_select' || version.question_type === 'multi_select'}
							<fieldset {...props} class="flex flex-col gap-3">
								<legend class="mb-3 text-base font-medium">
									{version.question_type === 'multi_select'
										? 'Select all that apply.'
										: 'Select one.'}
									{#if version.max_selections}Choose up to {version.max_selections}.{/if}
								</legend>
								{#each version.options as option (option.id)}
									<label class="flex cursor-pointer items-center gap-3 py-2 text-lg font-medium">
										<input
											type={version.question_type === 'single_select' ? 'radio' : 'checkbox'}
											name={`options-${version.id}`}
											checked={draft.optionIds.includes(option.id)}
											onchange={() => selectOption(question, option.id)}
											class="size-5 accent-primary"
										/>
										{option.label}
									</label>
								{/each}
								{#if version.allow_other}
									<label class="flex cursor-pointer items-center gap-3 py-2 text-lg font-medium">
										<input
											type={version.question_type === 'single_select' ? 'radio' : 'checkbox'}
											name={`options-${version.id}`}
											checked={draft.other}
											onchange={() => selectOther(question)}
											class="size-5 accent-primary"
										/>
										Other
									</label>
									{#if draft.other}
										<Input
											aria-label="Other answer"
											bind:value={$fields.answers[version.id].otherText}
											class="h-12 text-base"
										/>
									{/if}
								{/if}
								{#if version.prefer_not_to_say}
									<label class="flex cursor-pointer items-center gap-3 py-2 text-lg font-medium">
										<input
											type={version.question_type === 'single_select' ? 'radio' : 'checkbox'}
											name={`options-${version.id}`}
											checked={draft.preferNotToSay}
											onchange={() => selectPreferNotToSay(question)}
											class="size-5 accent-primary"
										/>
										Prefer not to say
									</label>
								{/if}
							</fieldset>
						{:else}
							<label for={props.id} class="mb-2 block text-base font-medium">
								{#if version.question_type === 'date'}
									{dateLabel(version)}
								{:else}
									Your answer
								{/if}
							</label>
							<Input
								{...props}
								type={dateInputType(version)}
								inputmode={version.question_type === 'number' ? 'decimal' : undefined}
								bind:value={$fields.answers[version.id].value}
								class="h-12 text-base"
							/>
						{/if}
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			{#if version.special_category}
				<Form.Field {form} name={`answers.${version.id}.consent`}>
					<Form.Control>
						{#snippet children({ props })}
							<label class="mt-6 flex items-start gap-3 text-base">
								<input
									{...props}
									type="checkbox"
									bind:checked={$fields.answers[version.id].consent}
									class="mt-1 size-5 shrink-0 accent-primary"
								/>
								{version.consent_text}
							</label>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}
			<button
				type="button"
				class="mt-6 text-base font-medium underline"
				onclick={() => clearAnswer(question)}
			>
				Clear answer
			</button>
		</div>
	</Dialog>
{/if}
