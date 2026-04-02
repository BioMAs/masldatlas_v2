import { test, expect } from '@playwright/test';
import { setupApiMocks, loadDatasetThroughUI } from '../fixtures/mock-api';
import { MOCK_FILTERED_SESSION_ID } from '../fixtures/mock-data';

test.describe('ClusterFilter — filtrage par clusters', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await loadDatasetThroughUI(page);
  });

  test('le composant ClusterFilter est visible dans la sidebar', async ({ page }) => {
    await expect(page.getByText('Filter by Clusters')).toBeVisible({ timeout: 5000 });
  });

  test('le bouton Expand développe le panneau de filtres', async ({ page }) => {
    // Le panel peut être déjà ouvert (auto-expansé) ou fermé
    const expandBtn = page.getByRole('button', { name: 'Expand', exact: true });
    const collapseBtn = page.getByRole('button', { name: 'Collapse', exact: true });
    if (await expandBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expandBtn.click();
    }
    // Après expansion (ou déjà ouvert), les checkboxes doivent être visibles
    await expect(page.locator('label').filter({ hasText: 'Hepatocyte' }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('label').filter({ hasText: 'Kupffer cell' }).first()).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Stellate cell' }).first()).toBeVisible();
  });

  test('les boutons Select All et Deselect All fonctionnent', async ({ page }) => {
    // S'assurer que le panel est ouvert
    const expandBtn = page.getByRole('button', { name: 'Expand', exact: true });
    if (await expandBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expandBtn.click();
    }
    await page.getByRole('button', { name: 'Select All', exact: true }).click();
    // Toutes les checkboxes doivent être cochées
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }

    await page.getByRole('button', { name: 'Deselect All', exact: true }).click();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }
  });

  test('on peut cocher un cluster individuel', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand' }).click();
    const hepatoCheckbox = page.locator('label').filter({ hasText: 'Hepatocyte' }).locator('input[type="checkbox"]');
    await hepatoCheckbox.check();
    await expect(hepatoCheckbox).toBeChecked();
  });

  test('click Apply Filter déclenche la requête de filtrage', async ({ page }) => {
    let filterCalled = false;
    // Vrai endpoint : POST /api/analysis/filter-by-clusters/{sessionId}
    await page.route('**/api/analysis/filter-by-clusters/**', (route) => {
      filterCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_id: MOCK_FILTERED_SESSION_ID,
          info: {
            organism: 'Human',
            dataset_name: 'GSE181483',
            n_cells: 5432,
            n_genes: 2800,
            cell_types: ['Hepatocyte'],
            metadata_columns: ['cell_type', 'sample'],
            available_layers: ['X'],
            has_umap: true,
            obs_keys: ['cell_type'],
            var_keys: [],
          },
        }),
      });
    });

    const expandBtn2 = page.getByRole('button', { name: 'Expand', exact: true });
    if (await expandBtn2.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expandBtn2.click();
    }
    await page.getByRole('button', { name: 'Select All', exact: true }).click();
    await page.getByRole('button', { name: /Apply Filter/i }).click();
    await page.waitForTimeout(500);
    expect(filterCalled).toBe(true);
  });
});

test.describe('ClusterSelection — 3 modes de visualisation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await loadDatasetThroughUI(page);
    await page.getByRole('button', { name: 'Cluster Selection' }).click();
  });

  test('l\'onglet Cluster Selection s\'affiche', async ({ page }) => {
    await expect(page.getByText('No dataset loaded')).not.toBeVisible();
  });

  test('les 3 boutons de mode sont présents', async ({ page }) => {
    await expect(page.getByText('Visualize Gene Expression')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Visualize Geneset Expression')).toBeVisible();
    await expect(page.getByText('Calculate Co-Expression')).toBeVisible();
  });

  test('mode Gene Expression est actif par défaut', async ({ page }) => {
    // Le bouton actif a la classe border-blue-500
    await expect(page.locator('button[class*="border-blue-500"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('click sur "Calculate Co-Expression" change le mode actif', async ({ page }) => {
    await page.getByText('Calculate Co-Expression').click();
    await expect(page.getByText(/Spearman|Co-Expression/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('mode Gene Expression — sous-onglets Markers et Cluster Analysis sont présents', async ({ page }) => {
    // Cibler exactement le sous-onglet (le bouton mode contient 'marker genes' dans sa description → regex inadapté)
    await expect(page.getByRole('button', { name: 'Marker Genes (One-vs-Rest)', exact: true })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Cluster Analysis', exact: true })).toBeVisible();
  });

  test('mode Gene Expression — switch entre Markers et Cluster Analysis', async ({ page }) => {
    await page.getByRole('button', { name: /Cluster Analysis/i }).click();
    // L'onglet Cluster Analysis est maintenant actif
    const clusterBtn = page.getByRole('button', { name: /Cluster Analysis/i });
    await expect(clusterBtn).toHaveClass(/border-blue-600/);
  });
});
