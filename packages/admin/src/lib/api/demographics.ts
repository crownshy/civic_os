import type { createApiClient } from '@crownshy/api-client/client';
import {
	DEFAULT_DEMOGRAPHIC_QUESTIONS,
	hasBucketOptions,
	type DemographicQuestionData
} from '@civicos/shared/data/demographics';

type Api = ReturnType<typeof createApiClient>;

/** What reading and repairing the question definitions needs. */
type QuestionsApi = Pick<
	Api,
	'GetDemographicsQuestions' | 'CreateDemographicsQuestion' | 'UpdateDemographicsQuestion'
>;

/** Return all questions after recreating any missing migration defaults. */
export async function ensureDefaultDemographicQuestions(api: QuestionsApi) {
	const questions = await api
		.GetDemographicsQuestions({ queries: { limit: 200 } })
		.then((result) => result.records);
	const existingSlugs = new Set(questions.map((question) => question.slug));
	const missing = DEFAULT_DEMOGRAPHIC_QUESTIONS.filter(
		(question) => !existingSlugs.has(question.slug)
	);
	const created = await Promise.all(
		missing.map((question) => api.CreateDemographicsQuestion(question))
	);

	return restoreDefaultOptions(api, [...questions, ...created]);
}

/**
 * Put the answer options back on a seeded default that came back without any.
 *
 * Only `age` arrives from comhairle's migrations carrying a `bucketConfig`, so
 * Setup listed Ethnicity, Gender and Political Party with an empty Options
 * column. The options are not admin's to invent: they are the list civicos
 * offers on About You, and `DEFAULT_DEMOGRAPHIC_QUESTIONS` is the checked-in
 * copy of exactly that list, which is why writing it back is a repair and not
 * a policy decision.
 *
 * The write is best effort and the local options are returned either way. A
 * card showing no options is the bug being fixed here, and a PATCH that did not
 * land is no reason to keep showing one.
 */
async function restoreDefaultOptions(
	api: QuestionsApi,
	questions: DemographicQuestionData[]
): Promise<DemographicQuestionData[]> {
	const repairs = DEFAULT_DEMOGRAPHIC_QUESTIONS.filter((seed) =>
		questions.some((question) => question.slug === seed.slug && !hasBucketOptions(question))
	);
	if (repairs.length === 0) return questions;

	await Promise.all(
		repairs.map((seed) =>
			api
				.UpdateDemographicsQuestion(
					{ bucketConfig: seed.bucketConfig },
					{ params: { question_slug: seed.slug } }
				)
				.catch((e) => {
					console.warn(`Could not restore options on "${seed.slug}"`, e);
				})
		)
	);

	const bySlug = new Map(repairs.map((seed) => [seed.slug, seed.bucketConfig]));

	return questions.map((question) =>
		bySlug.has(question.slug) ? { ...question, bucketConfig: bySlug.get(question.slug) } : question
	);
}

/** Enable every available migration default for a newly created Conversation. */
export async function enableDefaultDemographics(api: Api, conversationId: string) {
	const questions = await ensureDefaultDemographicQuestions(api);
	const defaultSlugs = new Set(DEFAULT_DEMOGRAPHIC_QUESTIONS.map((question) => question.slug));

	await Promise.all(
		questions
			.filter((question) => defaultSlugs.has(question.slug))
			.map((question) =>
				api.CreateConversationDemographics({
					conversationId,
					questionSlug: question.slug
				})
			)
	);
}
