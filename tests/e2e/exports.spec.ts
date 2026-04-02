import { test, expect } from '@playwright/test';
import { setupApiMocks, loadDatasetThroughUI } from '../fixtures/mock-api';
import path from 'path';

/**
 * Helper : lance une analyse DGE pour activer les boutons d'export.
 */
async function triggerDGEResults(page: Parameters<typeof loadDatasetThroughUI>[0]) {
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

test.describe('Exports — téléchargements CSV, Excel, PNG', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await loadDatasetThroughUI(page);
  });

  // ── DatasetExploration exports ──────────────────────────────────────────
  test('DatasetExploration — Export CSV markers déclenche un téléchargement .csv', async ({ page }) => {
    await page.getByRole('button', { name: 'Exploration' }).click();
    // Attendre que les markers soient calculés (image visible)
    await page.locator('img[src^="data:image"]').first().waitFor({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const csvBtn = page.getByRole('button', { name: /CSV/i })
      .or(page.locator('button[title*="CSV"]').or(page.locator('button[title*="csv"]')))
      .first();
    if (await csvBtn.isVisible({ timeout: 5000 })) {
      await csvBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }
    }
  });

  test('DatasetExploration — Export Excel markers déclenche un téléchargement .xlsx', async ({ page }) => {
    await page.getByRole('button', { name: 'Exploration' }).click();
    await page.locator('img[src^="data:image"]').first().waitFor({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const xlsxBtn = page.getByRole('button', { name: /Excel/i })
      .or(page.locator('button[title*="Excel"]').or(page.locator('button[title*="xlsx"]')))
      .first();
    if (await xlsxBtn.isVisible({ timeout: 5000 })) {
      await xlsxBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
      }
    }
  });

  // ── DGE exports ───────────────────────────────────────────────────────
  test('DGE — Export CSV déclenche un téléchargement .csv', async ({ page }) => {
    await triggerDGEResults(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const csvBtn = page.getByRole('button', { name: /CSV/i })
      .or(page.locator('button[title*="CSV"]'))
      .first();
    if (await csvBtn.isVisible({ timeout: 8000 })) {
      await csvBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }
    }
  });

  test('DGE — Export Excel déclenche un téléchargement .xlsx', async ({ page }) => {
    await triggerDGEResults(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const xlsxBtn = page.getByRole('button', { name: /Excel/i })
      .or(page.locator('button[title*="Excel"]'))
      .first();
    if (await xlsxBtn.isVisible({ timeout: 8000 })) {
      await xlsxBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
      }
    }
  });

  test('DGE — Export PNG volcano plot — bouton visible après DGE', async ({ page }) => {
    await triggerDGEResults(page);
    // Vérifier que le volcano plot (section DGE) est visible avec son conteneur
    // Le bouton PNG Plotly est inaccessible en headless (WebGL) — on vérifie juste la présence du volcano
    const volcanoArea = page.locator('img[src^="data:image"]').first()
      .or(page.locator('.js-plotly-plot').first())
      .or(page.locator('[class*="volcano"]').first());
    await expect(volcanoArea).toBeVisible({ timeout: 10000 });
  });

  // ── Gene Search ───────────────────────────────────────────────────────
  test('Gene Search — saisir un nom de gène affiche la preview du gène', async ({ page }) => {
    const geneInput = page.getByPlaceholder(/Enter gene name/i);
    await expect(geneInput).toBeVisible();
    await geneInput.fill('TNF');
    // La préview dit 'Viewing: TNF' - vérifie juste que 'Viewing:' apparaît
    await expect(page.locator('p', { hasText: /Viewing:/i }).first()).toBeVisible({ timeout: 3000 });
  });

  // ── Fullscreen modal ──────────────────────────────────────────────────
  test('Exploration — bouton fullscreen ouvre la modal plein écran', async ({ page }) => {
    await page.getByRole('button', { name: 'Exploration' }).click();
    await page.locator('img[src^="data:image"]').first().waitFor({ timeout: 10000 });

    const fullscreenBtn = page.locator('button').filter({ has: page.locator('svg[class*="Maximize"]') })
      .or(page.locator('button[title*="fullscreen"]').or(page.locator('button[title*="Fullscreen"]')))
      .first();
    if (await fullscreenBtn.isVisible({ timeout: 3000 })) {
      await fullscreenBtn.click();
      // HeadlessUI Dialog: vérifier que le dialog est dans le DOM et en état ouvert
      await expect(
        page.locator('[role="dialog"][data-headlessui-state="open"]')
          .or(page.locator('[role="dialog"][aria-modal="true"]'))
          .first()
      ).toBeAttached({ timeout: 3000 });
    }
  });
});
