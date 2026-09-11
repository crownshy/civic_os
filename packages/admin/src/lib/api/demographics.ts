import type { createApiClient } from '@crownshy/api-client/client';
import { DEFAULT_DEMOGRAPHIC_QUESTIONS } from '@civicos/shared/data/demographics';

type Api = ReturnType<typeof createApiClient>;

/** Return all questions after recreating any missing migration defaults. */
export async function ensureDefaultDemographicQuestions(api: Api) {
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

	return [...questions, ...created];
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