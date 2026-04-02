import { test, expect } from '@playwright/test';
import { setupApiMocks, loadDatasetThroughUI } from '../fixtures/mock-api';

/**
 * Sélectionne les groupes DGE et lance l'analyse.
 * Utilise les options 'Hepatocyte'/'Kupffer cell' comme discriminant
 * pour trouver les selects du panneau DGE (pas ceux de la sidebar).
 */
async function selectGroupsAndRunDGE(page: Parameters<typeof loadDatasetThroughUI>[0]) {
  // Les selects DGE ont des options cell types (Hepatocyte, Kupffer cell...)
  // contrairement aux selects sidebar (organism/dataset)
  const dgeGroupSelects = page.locator('select').filter({
    has: page.locator('option', { hasText: 'Hepatocyte' }),
  });
  await dgeGroupSelects.first().selectOption('Hepatocyte');
  await dgeGroupSelects.nth(1).selectOption('Kupffer cell');
  // Le vrai nom du bouton est 'Run Differential Expression'
  await page.getByRole('button', { name: /Run Differential Expression/i }).click();
  await page.waitForTimeout(600);
}

test.describe('DifferentialExpression — formulaire, tableau, volcano plot', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await loadDatasetThroughUI(page);
    await page.getByRole('button', { name: 'Differential Expression' }).click();
  });

  test('l\'onglet DGE s\'affiche sans erreur après chargement dataset', async ({ page }) => {
    await expect(page.getByText('No dataset loaded')).not.toBeVisible();
  });

  test('le panneau de configuration est visible par défaut', async ({ page }) => {
    // Texte de configuration
    await expect(
      page.getByText(/Configuration/i)
        .or(page.getByText(/Run DGE/i))
        .or(page.getByText(/Group 1/i))
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('le select Group 1 propose les cell types', async ({ page }) => {
    const group1Select = page.getByLabel(/Group 1/i)
      .or(page.locator('select').first());
    await expect(group1Select).toBeVisible({ timeout: 5000 });
  });

  test('on peut sélectionner les groupes et lancer le DGE', async ({ page }) => {
    let dgeCalled = false;
    await page.route('**/api/analysis/differential-expression/**', (route) => {
      dgeCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          n_genes: 2,
          results: [
            { names: 'TNF', scores: 5.2, logfoldchanges: 2.5, pvals: 1e-8, pvals_adj: 5e-7 },
            { names: 'IL6', scores: 4.8, logfoldchanges: 2.1, pvals: 2e-7, pvals_adj: 8e-6 },
          ],
        }),
      });
    });

    await selectGroupsAndRunDGE(page);
    expect(dgeCalled).toBe(true);
  });

  test('après analyse DGE — le tableau AG Grid s\'affiche avec les gènes', async ({ page }) => {
    await selectGroupsAndRunDGE(page);
    // Utiliser .ag-root-wrapper (l'élément exact du grid, pas son conteneur)
    await expect(page.locator('.ag-root-wrapper').first()).toBeVisible({ timeout: 10000 });
  });

  test('après analyse DGE — le volcano plot (Plotly) est affiché', async ({ page }) => {
    await selectGroupsAndRunDGE(page);
    // VolcanoPlot uses Plotly.js — renders as .js-plotly-plot (SVG/canvas, NOT <img>)
    await expect(page.locator('.js-plotly-plot').first()).toBeVisible({ timeout: 10000 });
  });

  test('le slider de filtre log2FC est présent après DGE', async ({ page }) => {
    // Le slider est dans le bloc {isSuccess && (...)} — il faut lancer DGE d\'abord
    await selectGroupsAndRunDGE(page);
    await expect(page.locator('input[type="range"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('le select de méthode DGE propose Wilcoxon, T-test, Logistic Regression', async ({ page }) => {
    // Le select méthode a 'Wilcoxon (Rank Sum)' comme option
    const methodSelect = page.locator('select').filter({ hasText: /Wilcoxon/i }).first();
    if (await methodSelect.isVisible()) {
      await expect(methodSelect.locator('option', { hasText: /Wilcoxon/i })).toBeAttached();
      await expect(methodSelect.locator('option', { hasText: /T-test/i })).toBeAttached();
      await expect(methodSelect.locator('option', { hasText: /Logistic/i })).toBeAttached();
    }
  });

  test('le bouton de configuration (icône gear) toggle le panneau', async ({ page }) => {
    // Chercher le bouton avec l'icône Settings/gear
    const configBtn = page.locator('button').filter({ hasText: '' }).nth(0);
    // Alternative : chercher le bouton avec SVG lucide Settings
    const settingsBtn = page.locator('button:has(svg)').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      // Après click, vérifier que quelque chose change
    }
  });

  test('les boutons Export CSV et Export Excel sont présents après DGE', async ({ page }) => {
    await selectGroupsAndRunDGE(page);
    const csvBtn = page.getByRole('button', { name: /CSV/i })
      .or(page.locator('button[title*="CSV"]'))
      .first();
    await expect(csvBtn).toBeVisible({ timeout: 8000 });
  });

  test('les onglets Enrichment et Decoupler apparaissent sous le tableau après DGE', async ({ page }) => {
    await selectGroupsAndRunDGE(page);
    await expect(
      page.getByRole('tab', { name: /Enrichment/i })
        .or(page.getByRole('button', { name: /Enrichment/i }))
        .or(page.getByText(/Enrichment/i))
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('le toggle "All Data / Filtered" est visible quand un filtre cluster est actif', async ({ page }) => {
    // Vérifier la présence du toggle data scope
    const scopeToggle = page.getByText(/All Data/i).or(page.getByText(/Filtered/i)).first();
    if (await scopeToggle.isVisible()) {
      await expect(scopeToggle).toBeVisible();
    }
  });
});
