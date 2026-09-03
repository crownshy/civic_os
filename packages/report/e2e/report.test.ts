import { expect, test, type Page } from '@playwright/test';

/**
 * Guardrail for the bundled Bloom report at /[slug] and below.
 */

const REPORT = '/central-oregon-ai';

const EXPECTED_THEME = 'Governance & Decision-Making';
const EXPECTED_THEME_STATEMENT_COUNT = 26;
const EXPECTED_STATEMENT = 'When Oregon decides how to expand AI access';
const EXPECTED_THEME_KEY = 'governance';

/** Walk the intro sequence via the page bar's NEXT, which is how a reader advances. */
async function advanceToNextIntroPage(page: Page) {
	await page.getByRole('button', { name: 'NEXT' }).click();
}

test('drills down from the report home page to a theme page and opens a statement', async ({
	page
}) => {
	await page.goto(REPORT);

	// Landing Page
	await expect(
		page.getByRole('heading', { name: /What did Central Oregonians have to say about AI/i })
	).toBeVisible();

	// Demographics Page
	await page.getByRole('button', { name: 'Dive in' }).click();
	await expect(page.getByRole('heading', { name: '400+' })).toBeVisible();

	// Full Demographics Modal
	await page.getByRole('button', { name: /See full demographics/i }).click();
	const demographics = page.getByRole('dialog', { name: 'Demographics detail' });
	await expect(demographics).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(demographics).toBeHidden();

	// Opinion Groups
	await advanceToNextIntroPage(page);
	await expect(
		page.getByRole('heading', { name: /We identified a few different kinds/i })
	).toBeVisible();

	// Individual Opinion Group Modal
	await page.getByRole('button', { name: /Optimists/ }).click();
	const group = page.getByRole('dialog', { name: 'Group detail' });
	await expect(group).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(group).toBeHidden();

	// Consensus Page
	await advanceToNextIntroPage(page);
	await expect(
		page.getByRole('heading', { name: /we found a lot of common ground/i })
	).toBeVisible();

	// Theme Grid
	await advanceToNextIntroPage(page);
	await expect(
		page.getByRole('heading', { name: /What 400\+ people had to say about AI/i })
	).toBeVisible();

	// Single Theme
	await page.getByRole('button', { name: EXPECTED_THEME }).click();
	await expect(page.getByRole('heading', { name: EXPECTED_THEME, exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'What we learned' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'All Statements' })).toBeVisible();
	await expect(
		page.getByText(`${EXPECTED_THEME_STATEMENT_COUNT} statements`, { exact: true })
	).toBeVisible();
	await expect(
		page.getByText(`${EXPECTED_THEME_STATEMENT_COUNT} statements in this theme`)
	).toBeVisible();

	// Statement Modal From Theme Page
	await page.getByRole('button').filter({ hasText: EXPECTED_STATEMENT }).first().click();

	const statement = page.getByRole('dialog', { name: 'Statement detail' });
	await expect(statement).toBeVisible();
	await expect(statement.getByText(EXPECTED_STATEMENT, { exact: false })).toBeVisible();

	// paging moves to a different statement and keeps the position readout honest
	const positionBefore = await statement.getByText(/^\d+\s*\|\s*\d+$/).innerText();
	await page.keyboard.press('ArrowRight');
	await expect(statement.getByText(/^\d+\s*\|\s*\d+$/)).not.toHaveText(positionBefore);

	await page.keyboard.press('Escape');
	await expect(statement).toBeHidden();

	// still on the theme page, not thrown back to the top
	await expect(page.getByRole('heading', { name: EXPECTED_THEME, exact: true })).toBeVisible();
});

test('a consensus card opens the statement modal', async ({ page }) => {
	await page.goto(`${REPORT}/consensus`);
	await expect(
		page.getByRole('heading', { name: /we found a lot of common ground/i })
	).toBeVisible();

	const card = page.getByRole('button').filter({ hasText: /“/ }).first();
	const quoted = (await card.innerText()).match(/“([^”]+)”/)![1];
	await card.click();

	const statement = page.getByRole('dialog', { name: 'Statement detail' });
	await expect(statement).toBeVisible();
	await expect(statement.getByText(quoted.slice(0, 40), { exact: false })).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(statement).toBeHidden();
});

test('an unknown slug is not found', async ({ page }) => {
	const response = await page.goto('/not-a-real-report');
	expect(response?.status()).toBe(404);
});

test('each step has its own URL, and a deep link lands on it cold', async ({ page }) => {
	await page.goto(REPORT);
	await expect(page).toHaveURL(new RegExp(`${REPORT}$`));

	await page.getByRole('button', { name: 'Dive in' }).click();
	await expect(page).toHaveURL(new RegExp(`${REPORT}/demographics$`));

	await advanceToNextIntroPage(page);
	await expect(page).toHaveURL(new RegExp(`${REPORT}/groups$`));

	await advanceToNextIntroPage(page);
	await expect(page).toHaveURL(new RegExp(`${REPORT}/consensus$`));

	await advanceToNextIntroPage(page);
	await expect(page).toHaveURL(new RegExp(`${REPORT}/themes$`));

	await page.getByRole('button', { name: EXPECTED_THEME }).click();
	await expect(page).toHaveURL(new RegExp(`${REPORT}/themes/${EXPECTED_THEME_KEY}$`));

	// a full reload, not a client-side navigation: the server has to serve it
	await page.reload();
	await expect(page.getByRole('heading', { name: EXPECTED_THEME, exact: true })).toBeVisible();

	await page.goBack();
	await expect(page).toHaveURL(new RegExp(`${REPORT}/themes$`));
	await expect(
		page.getByRole('heading', { name: /What 400\+ people had to say about AI/i })
	).toBeVisible();
});

test('an unknown theme is not found', async ({ page }) => {
	// a 404 rather than a silent fall back to the title page, which would hide
	// broken links
	const response = await page.goto(`${REPORT}/themes/not-a-theme`);
	expect(response?.status()).toBe(404);
});

test('the county map renders its geography', async ({ page }) => {
	await page.goto(`${REPORT}/demographics`);
	await expect(page.getByRole('heading', { name: '400+' })).toBeVisible();

	// The map is the one page element that can fail silently: a projection error
	// still renders an SVG, just an empty or nonsensical one. Assert it actually
	// drew Oregon's counties rather than an empty frame.
	const counties = page.locator('svg path.demogCounty');
	await expect(counties.first()).toBeVisible();
	expect(await counties.count()).toBeGreaterThan(30);
});
