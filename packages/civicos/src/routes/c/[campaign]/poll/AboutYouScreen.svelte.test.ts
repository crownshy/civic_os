import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { AboutYouQuestion } from '$lib/services/demographics';
import AboutYouScreen from './AboutYouScreen.svelte';

afterEach(() => vi.restoreAllMocks());

function question(id: string, text: string, special = false): AboutYouQuestion {
	return {
		version: {
			id,
			question_id: `question-${id}`,
			text,
			question_type: 'single_select',
			options: [{ id: `${id}-yes`, label: 'Yes', position: 0 }],
			allow_other: false,
			prefer_not_to_say: false,
			special_category: special,
			consent_text: special ? 'I agree to share this answer.' : null,
			status: 'published',
			updated_at: '2026-01-01T00:00:00Z',
			version_number: 1
		},
		required: true,
		initial: {
			value: '',
			optionIds: [],
			other: false,
			otherText: '',
			preferNotToSay: false,
			consent: false
		}
	};
}

describe('About You', () => {
	it('requires the answer and explicit consent before submitting a special-category question', async () => {
		const item = question('11111111-1111-1111-1111-111111111111', 'Share your answer?', true);
		const onDone = vi.fn().mockResolvedValue({ success: true, saved: [] });
		await render(AboutYouScreen, { placeName: 'Test', questions: [item], onDone });

		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await expect.element(page.getByText('This question is required.')).toBeVisible();
		expect(onDone).not.toHaveBeenCalled();

		await page.getByRole('button', { name: /Share your answer/ }).click();
		await page.getByLabelText('Yes').click();
		await page.getByRole('button', { name: 'DONE' }).click();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await expect.element(page.getByText('Please agree before sharing this answer.')).toBeVisible();
		expect(onDone).not.toHaveBeenCalled();

		await page.getByRole('button', { name: /Share your answer/ }).click();
		await page.getByLabelText('I agree to share this answer.').click();
		await page.getByRole('button', { name: 'DONE' }).click();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await vi.waitFor(() =>
			expect(onDone).toHaveBeenCalledWith(
				expect.objectContaining({
					[item.version.id]: expect.objectContaining({
						optionIds: [`${item.version.id}-yes`],
						consent: true
					})
				}),
				[]
			)
		);
	});

	it('locks answers saved before a failure and retries only the remainder', async () => {
		const first = question('11111111-1111-1111-1111-111111111111', 'First question?');
		const second = question('22222222-2222-2222-2222-222222222222', 'Second question?');
		const onDone = vi
			.fn()
			.mockResolvedValueOnce({ success: false, saved: [first.version.id] })
			.mockResolvedValueOnce({ success: true, saved: [second.version.id] });
		await render(AboutYouScreen, { placeName: 'Test', questions: [first, second], onDone });

		for (const text of ['First question', 'Second question']) {
			await page.getByRole('button', { name: new RegExp(text) }).click();
			await page.getByLabelText('Yes').click();
			await page.getByRole('button', { name: 'DONE' }).click();
		}
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await expect.element(page.getByText(/Some answers didn't save/)).toBeVisible();
		await expect.element(page.getByRole('button', { name: /First question/ })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: /Second question/ })).toBeEnabled();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await vi.waitFor(() =>
			expect(onDone).toHaveBeenLastCalledWith(expect.anything(), [first.version.id])
		);
	});

	it('hides a conflicting draft and reports a later save failure separately', async () => {
		const first = question('11111111-1111-1111-1111-111111111111', 'First question?');
		const second = question('22222222-2222-2222-2222-222222222222', 'Second question?');
		const onDone = vi
			.fn()
			.mockResolvedValueOnce({
				success: false,
				saved: [first.version.id],
				conflict: first.version.id
			})
			.mockResolvedValueOnce({ success: false, saved: [] })
			.mockResolvedValueOnce({ success: true, saved: [second.version.id] });
		await render(AboutYouScreen, { placeName: 'Test', questions: [first, second], onDone });

		for (const text of ['First question', 'Second question']) {
			await page.getByRole('button', { name: new RegExp(text) }).click();
			await page.getByLabelText('Yes').click();
			await page.getByRole('button', { name: 'DONE' }).click();
		}
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		const firstButton = page.getByRole('button', { name: /First question/ });
		await expect.element(firstButton).toBeDisabled();
		await expect.element(firstButton).toHaveTextContent('Already submitted');
		await expect.element(firstButton).not.toHaveTextContent('Yes');
		await expect.element(page.getByText(/already submitted for this Campaign/)).toBeVisible();

		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await expect.element(page.getByText(/Some answers didn't save/)).toBeVisible();
		await expect.element(page.getByRole('button', { name: /Second question/ })).toBeEnabled();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await vi.waitFor(() =>
			expect(onDone).toHaveBeenLastCalledWith(expect.anything(), [first.version.id])
		);
	});

	it('allows another attempt if saving unexpectedly rejects', async () => {
		const item = question('11111111-1111-1111-1111-111111111111', 'First question?');
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
		const onDone = vi
			.fn()
			.mockRejectedValueOnce(new Error('unexpected failure'))
			.mockResolvedValueOnce({ success: true, saved: [item.version.id] });
		await render(AboutYouScreen, { placeName: 'Test', questions: [item], onDone });

		await page.getByRole('button', { name: /First question/ }).click();
		await page.getByLabelText('Yes').click();
		await page.getByRole('button', { name: 'DONE' }).click();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await expect.element(page.getByText(/Some answers didn't save/)).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'CONTINUE' })).toBeEnabled();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(2));
		expect(errorLog).toHaveBeenCalledOnce();
	});

	it('submits multi-select options and an Other response together', async () => {
		const item = question('33333333-3333-3333-3333-333333333333', 'Choose your options');
		item.version.question_type = 'multi_select';
		item.version.allow_other = true;
		item.version.options.push({ id: 'another', label: 'Another option', position: 1 });
		const onDone = vi.fn().mockResolvedValue({ success: true, saved: [] });
		await render(AboutYouScreen, { placeName: 'Test', questions: [item], onDone });

		await page.getByRole('button', { name: /Choose your options/ }).click();
		await page.getByLabelText('Yes').click();
		await page.getByLabelText('Other', { exact: true }).click();
		await page.getByLabelText('Other answer').fill('Something else');
		await page.getByRole('button', { name: 'DONE' }).click();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await vi.waitFor(() =>
			expect(onDone).toHaveBeenCalledWith(
				expect.objectContaining({
					[item.version.id]: expect.objectContaining({
						optionIds: [`${item.version.id}-yes`],
						other: true,
						otherText: 'Something else'
					})
				}),
				[]
			)
		);
	});

	it('makes Prefer not to say exclusive of selected options', async () => {
		const item = question('44444444-4444-4444-4444-444444444444', 'Choose a response');
		item.version.question_type = 'multi_select';
		item.version.prefer_not_to_say = true;
		const onDone = vi.fn().mockResolvedValue({ success: true, saved: [] });
		await render(AboutYouScreen, { placeName: 'Test', questions: [item], onDone });

		await page.getByRole('button', { name: /Choose a response/ }).click();
		await page.getByLabelText('Yes').click();
		await page.getByLabelText('Prefer not to say').click();
		await expect.element(page.getByLabelText('Yes')).not.toBeChecked();
		await page.getByRole('button', { name: 'DONE' }).click();
		await page.getByRole('button', { name: 'CONTINUE' }).click();
		await vi.waitFor(() =>
			expect(onDone).toHaveBeenCalledWith(
				expect.objectContaining({
					[item.version.id]: expect.objectContaining({
						optionIds: [],
						preferNotToSay: true
					})
				}),
				[]
			)
		);
	});
});
