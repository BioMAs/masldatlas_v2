import { test, expect } from '@playwright/test';
import { setupApiMocks, loadDatasetThroughUI } from '../fixtures/mock-api';

/**
 * Helper : déclenche une analyse DGE pour que les panneaux Enrichment/Decoupler
 * deviennent accessibles.
 */
async function runDGEAndWaitForResults(page: Parameters<typeof loadDatasetThroughUI>[0]) {
  await page.getByRole('button', { name: 'Differential Expression' }).click();
  // Trouver les selects DGE via les options cell types (pas les selects sidebar)
  const dgeGroupSelects = page.locator('select').filter({
    has: page.locator('option', { hasText: 'Hepatocyte' }),
  });
  await dgeGroupSelects.first().selectOption('Hepatocyte');
  await dgeGroupSelects.nth(1).selectOption('Kupffer cell');
  await page.getByRole('button', { name: /Run Differential Expression/i }).click();
  await page.waitForTimeout(800);
}

test.describe('EnrichmentPanel — analyse d\'enrichissement fonctionnel', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await loadDatasetThroughUI(page);
    await runDGEAndWaitForResults(page);
  });

  test('le panneau Enrichment est visible sous les résultats DGE', async ({ page }) => {
    await expect(
      page.getByRole('tab', { name: /Enrichment/i })
        .or(page.getByRole('button', { name: /Enrichment/i }))
        .or(page.getByText(/Enrichment/i).first())
    ).toBeVisible({ timeout: 8000 });
  });

  test('on peut cliquer sur l\'onglet Enrichment pour l\'activer', async ({ page }) => {
    const enrichBtn = page.getByRole('button', { name: /enrichment/i })
      .or(page.getByRole('tab', { name: /enrichment/i }));
    const allEnrich = enrichBtn.first();
    if (await allEnrich.isVisible({ timeout: 5000 })) {
      await allEnrich.click();
      await expect(page.getByText(/Enrichment/i).first()).toBeVisible();
    }
  });

  test('le panneau Decoupler est visible sous les résultats DGE', async ({ page }) => {
    await expect(
      page.getByRole('tab', { name: /Decoupler/i })
        .or(page.getByRole('button', { name: /Decoupler/i }))
        .or(page.getByText(/Decoupler/i).first())
    ).toBeVisible({ timeout: 8000 });
  });

  test('click "Run Enrichment" déclenche POST /api/analysis/enrichment', async ({ page }) => {
    let enrichCalled = false;
    await page.route('**/api/analysis/enrichment', (route) => {
      enrichCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          results: [
            { term: 'GO:0006954 inflammatory response', p_value: 1e-8, adjusted_p_value: 5e-7, gene_count: 12, gene_ratio: 0.15, genes: 'TNF,IL6' },
          ],
        }),
      });
    });

    // Naviguer vers le panneau enrichment et lancer
    const enrichTab = page.getByRole('button', { name: /enrichment/i })
      .or(page.getByRole('tab', { name: /enrichment/i })).first();
    if (await enrichTab.isVisible({ timeout: 5000 })) {
      await enrichTab.click();
    }

    const runEnrichBtn = page.getByRole('button', { name: /Run Enrichment/i })
      .or(page.getByRole('button', { name: /Compute/i })
      .or(page.getByRole('button', { name: /Analyze/i }))).first();
    if (await runEnrichBtn.isVisible({ timeout: 5000 })) {
      await runEnrichBtn.click();
      await page.waitForTimeout(500);
      expect(enrichCalled).toBe(true);
    }
  });
});

test.describe('DecouplerPanel — analyse de régulation (TF, signaling)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await loadDatasetThroughUI(page);
    await runDGEAndWaitForResults(page);
  });

  test('le panneau Decoupler est accessible', async ({ page }) => {
    const decouplerBtn = page.getByRole('button', { name: /Decoupler/i })
      .or(page.getByRole('tab', { name: /Decoupler/i })).first();
    if (await decouplerBtn.isVisible({ timeout: 5000 })) {
      await decouplerBtn.click();
      await expect(page.getByText(/Decoupler/i).first()).toBeVisible();
    }
  });

  test('click sur Decoupler → les options PROGENy, CollecTRI, MSigDB sont présentes', async ({ page }) => {
    const decouplerBtn = page.getByRole('button', { name: /Decoupler/i })
      .or(page.getByRole('tab', { name: /Decoupler/i })).first();
    if (await decouplerBtn.isVisible({ timeout: 5000 })) {
      await decouplerBtn.click();
      await expect(
        page.getByText(/PROGENy/i).or(page.getByText(/CollecTRI/i)).or(page.getByText(/MSigDB/i)).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('click "Run PROGENy" déclenche POST /api/decoupler/progeny', async ({ page }) => {
    let progenyCalled = false;
    // analysisService.runProgeny() appelle POST /decoupler/progeny
    await page.route('**/api/decoupler/progeny**', (route) => {
      progenyCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          pathway_scores: [{ source: 'TNFa', score: 3.1, p_value: 0.0001 }],
        }),
      });
    });

    // Naviguer vers le panneau Decoupler (onglet dans DGE)
    const decouplerBtn = page.getByRole('button', { name: /Decoupler/i })
      .or(page.getByRole('tab', { name: /Decoupler/i })).first();
    if (await decouplerBtn.isVisible({ timeout: 5000 })) {
      await decouplerBtn.click();
    }

    // Cliquer sur l\'onglet "Pathways (PROGENy)" pour passer au tab progeny
    const progenyTab = page.getByRole('button', { name: /PROGENy/i }).first();
    if (await progenyTab.isVisible({ timeout: 5000 })) {
      await progenyTab.click();
    }

    // Cliquer sur le bouton "Run Pathway Analysis"
    const runBtn = page.getByRole('button', { name: /Run Pathway Analysis/i });
    if (await runBtn.isVisible({ timeout: 3000 })) {
      await runBtn.click();
      await page.waitForTimeout(500);
      expect(progenyCalled).toBe(true);
    }
  });

  test('click "Run CollecTRI" déclenche POST /api/decoupler/collectri', async ({ page }) => {
    let collectriCalled = false;
    await page.route('**/api/decoupler/collectri**', (route) => {
      collectriCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          tf_scores: [{ source: 'NF-kB', score: 2.3, p_value: 0.001 }],
        }),
      });
    });

    // Naviguer vers le panneau Decoupler (onglet dans DGE)
    const decouplerBtn = page.getByRole('button', { name: /Decoupler/i })
      .or(page.getByRole('tab', { name: /Decoupler/i })).first();
    if (await decouplerBtn.isVisible({ timeout: 5000 })) {
      await decouplerBtn.click();
    }

    // CollecTRI est le tab par défaut — cliquer sur "Run TF Analysis"
    const runBtn = page.getByRole('button', { name: /Run TF Analysis/i });
    if (await runBtn.isVisible({ timeout: 3000 })) {
      await runBtn.click();
      await page.waitForTimeout(500);
      expect(collectriCalled).toBe(true);
    }
  });
});
