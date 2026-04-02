import { test, expect } from '@playwright/test';
import { setupApiMocks } from '../fixtures/mock-api';

test.describe('DatasetSelector — chargement de dataset', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
  });

  test('affiche le select organisme avec placeholder par défaut', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('');
    await expect(select.locator('option').first()).toHaveText(/Select an organism/i);
  });

  test('les organismes disponibles sont listés (Human, Mouse, Zebrafish, Integrated)', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select.locator('option', { hasText: 'Human' })).toBeAttached();
    await expect(select.locator('option', { hasText: 'Mouse' })).toBeAttached();
    await expect(select.locator('option', { hasText: 'Zebrafish' })).toBeAttached();
    await expect(select.locator('option', { hasText: 'Integrated' })).toBeAttached();
  });

  test('sans organisme sélectionné — le select dataset n\'est pas visible', async ({ page }) => {
    await expect(page.getByLabel(/Select Dataset/i)).not.toBeVisible();
  });

  test('sélection d\'un organisme fait apparaître le select dataset', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    // Le deuxième select (dataset) apparaît après sélection de l'organisme
    await expect(page.locator('select').nth(1)).toBeVisible();
  });

  test('les datasets Human sont listés après sélection de Human', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    const datasetSelect = page.locator('select').nth(1);
    await expect(datasetSelect.locator('option', { hasText: 'GSE181483' })).toBeAttached();
  });

  test('sélection dataset fait apparaître le select de taille', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    // Le troisième select (taille) apparaît après sélection du dataset
    await expect(page.locator('select').nth(2)).toBeVisible();
  });

  test('les options de taille sont présentes', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    const sizeSelect = page.locator('select').nth(2);
    await expect(sizeSelect.locator('option', { hasText: /Fast/i })).toBeAttached();
    await expect(sizeSelect.locator('option', { hasText: /Full Dataset/i })).toBeAttached();
    await expect(sizeSelect.locator('option', { hasText: /Large/i })).toBeAttached();
  });

  test('click "Load Dataset" déclenche la requête POST /api/datasets/load', async ({ page }) => {
    let loadCalled = false;
    await page.route('**/api/datasets/load', (route) => {
      loadCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'test-session-abc123',
          info: {
            organism: 'Human',
            dataset_name: 'GSE181483',
            n_cells: 12345,
            n_genes: 3000,
            cell_types: ['Hepatocyte', 'Kupffer cell'],
            metadata_columns: ['cell_type', 'sample'],
            available_layers: ['X'],
            has_umap: true,
            obs_keys: ['cell_type'],
            var_keys: [],
          },
        }),
      });
    });

    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    await page.getByRole('button', { name: /load dataset/i }).click();

    await page.waitForTimeout(500);
    expect(loadCalled).toBe(true);
  });

  test('après chargement — le badge de cellules s\'affiche dans le header', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    await page.getByRole('button', { name: /load dataset/i }).click();
    await expect(page.getByText('12,345 cells')).toBeVisible({ timeout: 10000 });
  });

  test('après chargement — ClusterFilter apparaît dans la sidebar', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    await page.getByRole('button', { name: /load dataset/i }).click();
    // Attendre session chargée
    await page.waitForSelector('text=12,345 cells', { timeout: 10000 });
    // Le cluster filter doit être visible
    await expect(page.getByText(/Filter by Cell Type/i).or(page.getByText(/Cluster Filter/i)).or(page.getByText(/Filter by Clusters/i))).toBeVisible({ timeout: 5000 });
  });

  test('après chargement — Gene Search apparaît dans la sidebar', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    await page.getByRole('button', { name: /load dataset/i }).click();
    await page.waitForSelector('text=12,345 cells', { timeout: 10000 });
    await expect(page.getByText('Gene Search')).toBeVisible();
    await expect(page.getByPlaceholder(/Enter gene name/i)).toBeVisible();
  });

  test('erreur réseau organisms — affiche le message d\'erreur', async ({ page }) => {
    // Écraser le mock avec une erreur réseau
    await page.route('**/api/datasets/organisms', (route) => route.abort());
    await page.reload();
    await expect(page.getByText(/Failed to load available organisms/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/backend server is running/i)).toBeVisible();
  });

  test('changement d\'organisme réinitialise le dataset sélectionné', async ({ page }) => {
    await page.locator('select').first().selectOption('Human');
    await page.locator('select').nth(1).selectOption('GSE181483');
    // Changer d'organisme
    await page.locator('select').first().selectOption('Mouse');
    const datasetSelect = page.locator('select').nth(1);
    await expect(datasetSelect).toHaveValue('');
  });

  test('chargement d\'un dataset Mouse', async ({ page }) => {
    await page.locator('select').first().selectOption('Mouse');
    const datasetSelect = page.locator('select').nth(1);
    await expect(datasetSelect.locator('option', { hasText: 'GSE145086' })).toBeAttached();
    await datasetSelect.selectOption('GSE145086');
    await page.getByRole('button', { name: /load dataset/i }).click();
    await expect(page.getByText('12,345 cells')).toBeVisible({ timeout: 10000 });
  });
});
