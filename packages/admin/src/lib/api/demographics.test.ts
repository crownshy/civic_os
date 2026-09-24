import { describe, expect, it, vi } from 'vitest';
import { demographicsFromBackend } from '@civicos/shared/data/demographics';
import { ensureDefaultDemographicQuestions } from './demographics';

/**
 * What staging answers `GET /demographics/questions` with: comhairle seeds the
 * four defaults but bucket-configures only `age`, so the other three arrive
 * carrying an empty option list rather than no `bucketConfig` at all.
 */
const SEEDED = [
	{
		slug: 'age',
		displayName: 'Age',
		responseType: 'number',
		bucketConfig: {
			type: 'numeric',
			buckets: [
				{ min: null, max: 17, label: 'Under 18' },
				{ min: 65, max: null, label: '65+' }
			]
		}
	},
	{
		slug: 'ethnicity',
		displayName: 'Ethnicity',
		responseType: 'string',
		bucketConfig: { type: 'string', options: [] }
	},
	{
		slug: 'gender',
		displayName: 'Gender',
		responseType: 'string',
		bucketConfig: { type: 'string', options: [] }
	},
	{
		slug: 'political_party',
		displayName: 'Political Party',
		responseType: 'string',
		bucketConfig: { type: 'string', options: [] }
	}
];

function fakeApi(overrides: { UpdateDemographicsQuestion?: () => Promise<unknown> } = {}) {
	return {
		GetDemographicsQuestions: vi.fn(() =>
			Promise.resolve({ records: structuredClone(SEEDED), total: SEEDED.length })
		),
		CreateDemographicsQuestion: vi.fn((question: unknown) => Promise.resolve(question)),
		UpdateDemographicsQuestion: vi.fn(
			overrides.UpdateDemographicsQuestion ?? (() => Promise.resolve({}))
		)
	} as unknown as Parameters<typeof ensureDefaultDemographicQuestions>[0] & {
		GetDemographicsQuestions: ReturnType<typeof vi.fn>;
		CreateDemographicsQuestion: ReturnType<typeof vi.fn>;
		UpdateDemographicsQuestion: ReturnType<typeof vi.fn>;
	};
}

/** The Options column, as the Setup card builds it. */
function optionsFor(questions: Parameters<typeof demographicsFromBackend>[0], slug: string) {
	return demographicsFromBackend(questions, []).find((c) => c.slug === slug)?.options;
}

describe('ensureDefaultDemographicQuestions', () => {
	it('fills in the options on a default the backend seeded empty', async () => {
		const api = fakeApi();

		const questions = await ensureDefaultDemographicQuestions(api);

		expect(optionsFor(questions, 'gender')).toEqual(['Male', 'Female', 'Nonbinary', 'Other']);
		expect(optionsFor(questions, 'ethnicity')).toContain('White');
		expect(optionsFor(questions, 'political_party')).toContain('Moderate');
	});

	it('writes them back, so anything else reading the question gets the same list', async () => {
		const api = fakeApi();

		await ensureDefaultDemographicQuestions(api);

		expect(api.UpdateDemographicsQuestion).toHaveBeenCalledTimes(3);
		expect(api.UpdateDemographicsQuestion).toHaveBeenCalledWith(
			{ bucketConfig: { type: 'string', options: expect.any(Array) } },
			{ params: { question_slug: 'gender' } }
		);
	});

	it('still renders the options when the write is refused', async () => {
		const api = fakeApi({ UpdateDemographicsQuestion: () => Promise.reject(new Error('401')) });

		const questions = await ensureDefaultDemographicQuestions(api);

		expect(optionsFor(questions, 'gender')).toEqual(['Male', 'Female', 'Nonbinary', 'Other']);
	});

	it('leaves a default that already has its buckets alone', async () => {
		const api = fakeApi();

		const questions = await ensureDefaultDemographicQuestions(api);

		expect(optionsFor(questions, 'age')).toEqual(['Under 18', '65+']);
		expect(api.UpdateDemographicsQuestion).not.toHaveBeenCalledWith(expect.anything(), {
			params: { question_slug: 'age' }
		});
	});
});
