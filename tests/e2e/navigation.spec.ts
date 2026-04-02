import { test, expect } from '@playwright/test';
import { setupApiMocks, loadDatasetThroughUI } from '../fixtures/mock-api';

test.describe('Navigation — onglets et layout général', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
  });

  test('affiche le header avec le titre MASLDatlas v2.0', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /MASLDatlas/i })).toBeVisible();
    // Scoper à h1 pour éviter le conflit avec le footer
    await expect(page.locator('h1').getByText('v2.0')).toBeVisible();
  });

  test('affiche le sous-titre "Multi-species scRNA-seq"', async ({ page }) => {
    await expect(page.getByText(/Multi-species scRNA-seq Atlas/i)).toBeVisible();
  });

  test('affiche le badge "FastAPI + React"', async ({ page }) => {
    await expect(page.getByText('FastAPI + React')).toBeVisible();
  });

  test('les 5 onglets sont présents', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Exploration' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cluster Selection' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Differential Expression' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pseudo-bulk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Documentation' })).toBeVisible();
  });

  test('sans dataset — affiche "No dataset loaded" sur les onglets de données', async ({ page }) => {
    // Exploration est l'onglet actif par défaut
    await expect(page.getByText('No dataset loaded')).toBeVisible();
    await expect(page.getByText('Select and load a dataset to begin analysis')).toBeVisible();
  });

  test('Documentation est accessible sans dataset', async ({ page }) => {
    await page.getByRole('button', { name: 'Documentation' }).click();
    // Le contenu documentation s'affiche (pas de message "No dataset loaded")
    await expect(page.getByText('No dataset loaded')).not.toBeVisible();
  });

  test('navigation entre onglets — chaque onglet passe en actif au clic', async ({ page }) => {
    const tabNames = ['Cluster Selection', 'Differential Expression', 'Pseudo-bulk', 'Documentation'];
    for (const name of tabNames) {
      await page.getByRole('button', { name }).click();
      // L'onglet cliqué est visuellement sélectionné (classe border-blue-600)
      const tabBtn = page.getByRole('button', { name });
      await expect(tabBtn).toHaveClass(/border-blue-600/);
    }
  });

  test('sidebar est visible par défaut avec le sélecteur de dataset', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Load Dataset/i })).toBeVisible();
    // Vérifier le <select> lui-même (les <option> sont hidden sur select fermé)
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('le bouton Close ferme la sidebar', async ({ page }) => {
    await page.getByRole('button', { name: 'Close' }).click();
    // La sidebar s'efface (la heading Load Dataset n'est plus visible)
    await expect(page.getByRole('heading', { name: /Load Dataset/i })).not.toBeVisible();
  });

  test('le bouton Open Side Panel réouvre la sidebar', async ({ page }) => {
    await setupApiMocks(page);
    // Charger un dataset d'abord pour avoir le bouton "Open Side Panel"
    await loadDatasetThroughUI(page);
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: /Open Side Panel/i }).click();
    await expect(page.getByRole('heading', { name: /Load Dataset/i })).toBeVisible();
  });

  test('le footer affiche le nom de l\'application', async ({ page }) => {
    await expect(page.getByText(/MASLDatlas v2\.0 - Powered by/i)).toBeVisible();
  });

  test('après chargement dataset — le badge de cellules apparaît dans le header', async ({ page }) => {
    await loadDatasetThroughUI(page);
    await expect(page.getByText('12,345 cells')).toBeVisible();
  });

  test('navigation vers les onglets d\'analyse après chargement du dataset', async ({ page }) => {
    await loadDatasetThroughUI(page);

    // Exploration
    await page.getByRole('button', { name: 'Exploration' }).click();
    await expect(page.getByText('No dataset loaded')).not.toBeVisible();

    // DGE
    await page.getByRole('button', { name: 'Differential Expression' }).click();
    await expect(page.getByText('No dataset loaded')).not.toBeVisible();

    // Pseudo-bulk
    await page.getByRole('button', { name: 'Pseudo-bulk' }).click();
    await expect(page.getByText('No dataset loaded')).not.toBeVisible();
  });
});
