import { z } from 'zod';
import { responseValue, type AboutYouQuestion, type AnswerDraft } from '$lib/services/demographics';

const draftSchema = z.object({
	value: z.string(),
	optionIds: z.array(z.string()),
	other: z.boolean(),
	otherText: z.string(),
	preferNotToSay: z.boolean(),
	consent: z.boolean()
});

function validDate(value: string, precision: string | null | undefined): boolean {
	const patterns = {
		year: /^\d{4}$/,
		month: /^\d{4}-\d{2}$/,
		day: /^\d{4}-\d{2}-\d{2}$/
	};
	if (!precision || !(precision in patterns)) return false;
	if (!patterns[precision as keyof typeof patterns].test(value)) return false;
	let complete = value;
	if (precision === 'year') complete = `${value}-01-01`;
	else if (precision === 'month') complete = `${value}-01`;
	const date = new Date(`${complete}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === complete;
}

function answerError(question: AboutYouQuestion, draft: AnswerDraft): string | null {
	const { version } = question;
	const select =
		version.question_type === 'single_select' || version.question_type === 'multi_select';
	if (select) {
		if (draft.other && !draft.otherText.trim()) return 'Enter your answer for Other.';
		if (draft.optionIds.some((id) => !version.options.some((option) => option.id === id))) {
			return 'Choose an available option.';
		}
		if (version.max_selections != null && draft.optionIds.length > version.max_selections) {
			return `Choose no more than ${version.max_selections} options.`;
		}
	} else if (draft.value.trim()) {
		if (version.question_type === 'number' && !Number.isFinite(Number(draft.value))) {
			return 'Enter a number.';
		}
		if (version.question_type === 'date' && !validDate(draft.value, version.date_precision)) {
			return 'Enter a valid date in the requested format.';
		}
	}
	if (question.required && responseValue(question, draft) === undefined) {
		return 'This question is required.';
	}
	return null;
}

export function answerSchema(questions: AboutYouQuestion[]) {
	return z
		.object({ answers: z.record(z.string(), draftSchema) })
		.superRefine(({ answers }, context) => {
			for (const question of questions) {
				const draft = answers[question.version.id];
				if (!draft) {
					context.addIssue({
						code: 'custom',
						path: ['answers', question.version.id, 'value'],
						message: 'This question could not be loaded.'
					});
					continue;
				}
				const message = answerError(question, draft);
				if (message) {
					context.addIssue({
						code: 'custom',
						path: ['answers', question.version.id, 'value'],
						message
					});
				}
				if (
					question.version.special_category &&
					responseValue(question, draft) !== undefined &&
					!draft.consent
				) {
					context.addIssue({
						code: 'custom',
						path: ['answers', question.version.id, 'consent'],
						message: 'Please agree before sharing this answer.'
					});
				}
			}
		});
}
