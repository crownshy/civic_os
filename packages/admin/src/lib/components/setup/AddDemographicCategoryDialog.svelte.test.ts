import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import AddDemographicCategoryDialog from './AddDemographicCategoryDialog.svelte';

describe('demographics question editor', () => {
	it('edits a text question without requiring options', async () => {
		const category = {
			id: 'q1',
			displayName: 'Describe your experience',
			options: [],
			answerFormat: 'Free text',
			enabled: true
		};
		const onSave = vi.fn().mockResolvedValue(undefined);
		await render(AddDemographicCategoryDialog, {
			open: true,
			category,
			existing: [category],
			onSave
		});

		await expect.element(page.getByText('Participants provide a free text answer.')).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Options' })).not.toBeInTheDocument();
		await page.getByLabelText('Category name').fill('Tell us about your experience');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await vi.waitFor(() =>
			expect(onSave).toHaveBeenCalledWith({
				...category,
				displayName: 'Tell us about your experience'
			})
		);
	});

	it('describes multi-select questions accurately and preserves their type', async () => {
		const category = {
			id: 'q2',
			displayName: 'Interests',
			options: ['Parks', 'Transit'],
			multipleSelection: true,
			enabled: true
		};
		const onSave = vi.fn().mockResolvedValue(undefined);
		await render(AddDemographicCategoryDialog, {
			open: true,
			category,
			existing: [category],
			onSave
		});

		await expect.element(page.getByText('Participants can select multiple options.')).toBeVisible();
		await page.getByLabelText('Category name').fill('Your interests');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await vi.waitFor(() =>
			expect(onSave).toHaveBeenCalledWith({ ...category, displayName: 'Your interests' })
		);
	});

	it('rejects repeated options and saves an option being edited', async () => {
		const category = {
			id: 'q3',
			displayName: 'Transport',
			options: ['Bus', 'Train'],
			enabled: true
		};
		const onSave = vi.fn().mockResolvedValue(undefined);
		await render(AddDemographicCategoryDialog, {
			open: true,
			category,
			existing: [category],
			onSave
		});

		await page.getByRole('button', { name: 'Edit Bus' }).click();
		await page.getByLabelText('Option 1').fill('Train');
		await expect.element(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
		await page.getByLabelText('Option 1').fill('Bicycle');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await vi.waitFor(() =>
			expect(onSave).toHaveBeenCalledWith({ ...category, options: ['Bicycle', 'Train'] })
		);
	});
});
