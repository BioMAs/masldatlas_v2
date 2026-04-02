import type { Page } from '@playwright/test';
import {
  MOCK_ORGANISMS,
  MOCK_DATASET_LOAD_RESPONSE,
  MOCK_DATASET_INFO,
  MOCK_GENES,
  MOCK_UMAP_RESPONSE,
  MOCK_VIOLIN_RESPONSE,
  MOCK_DOTPLOT_RESPONSE,
  MOCK_MARKERS,
  MOCK_DGE_RESPONSE,
  MOCK_VOLCANO_RESPONSE,
  MOCK_ENRICHMENT_RESPONSE,
  MOCK_COLLECTRI_RESPONSE,
  MOCK_PROGENY_RESPONSE,
  MOCK_MSIGDB_RESPONSE,
  MOCK_FILTER_RESPONSE,
  MOCK_CORRELATION_RESPONSE,
  MOCK_SCATTER_RESPONSE,
  MOCK_TOP_CORRELATED_RESPONSE,
  MOCK_PSEUDOBULK_RESPONSE,
  MOCK_SUBSET_STATS,
} from './mock-data';

/**
 * Intercepts all /api/* requests and responds with mock data.
 * Call this in beforeEach to ensure mocks are in place before each test.
 */
export async function setupApiMocks(page: Page) {
  // ── Datasets ──────────────────────────────────────────────────────────
  await page.route('**/api/datasets/organisms', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORGANISMS) })
  );

  await page.route('**/api/datasets/load', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATASET_LOAD_RESPONSE) })
  );

  // GET /api/datasets/info/{sessionId}
  await page.route('**/api/datasets/info/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATASET_INFO) })
  );

  // GET /api/datasets/genes/{sessionId}
  await page.route('**/api/datasets/genes/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_GENES) })
  );

  // POST /api/datasets/filter/{sessionId}
  await page.route('**/api/datasets/filter/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_FILTER_RESPONSE) })
  );

  // POST /api/analysis/filter-by-clusters/{sessionId}  (ClusterFilter component)
  await page.route('**/api/analysis/filter-by-clusters/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_FILTER_RESPONSE) })
  );

  // GET /api/datasets/subset-stats/{sessionId}
  await page.route('**/api/datasets/subset-stats/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SUBSET_STATS) })
  );

  // POST /api/datasets/unload/{sessionId}
  await page.route('**/api/datasets/unload/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );

  // ── Visualizations ────────────────────────────────────────────────────
  // GET /api/visualization/umap/{sessionId} (also /umap/{sessionId}?color_by=...)
  await page.route('**/api/visualization/umap/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_UMAP_RESPONSE) })
  );

  // GET /api/visualization/violin/{sessionId}
  await page.route('**/api/visualization/violin/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_VIOLIN_RESPONSE) })
  );

  // GET /api/visualization/dotplot/{sessionId}
  await page.route('**/api/visualization/dotplot/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DOTPLOT_RESPONSE) })
  );

  // POST /api/visualization/volcano
  await page.route('**/api/visualization/volcano', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_VOLCANO_RESPONSE) })
  );

  // POST /api/visualization/correlation-scatter/{sessionId}
  await page.route('**/api/visualization/correlation-scatter/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCATTER_RESPONSE) })
  );

  // ── Analysis ──────────────────────────────────────────────────────────
  // POST /api/analysis/markers/{sessionId}
  await page.route('**/api/analysis/markers/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MARKERS) })
  );

  // POST /api/analysis/differential-expression/{sessionId}
  await page.route('**/api/analysis/differential-expression/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DGE_RESPONSE) })
  );

  // POST /api/enrichment/functional/{sessionId}
  await page.route('**/api/enrichment/functional/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ENRICHMENT_RESPONSE) })
  );

  // POST /api/decoupler/collectri (+ sub-routes)
  await page.route('**/api/decoupler/collectri**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COLLECTRI_RESPONSE) })
  );

  // POST /api/enrichment/pathway-activity/{sessionId}
  await page.route('**/api/enrichment/pathway-activity/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROGENY_RESPONSE) })
  );

  // POST /api/decoupler/msigdb (+ sub-routes)
  await page.route('**/api/decoupler/msigdb**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MSIGDB_RESPONSE) })
  );

  // POST /api/decoupler/progeny (+ sub-routes)
  await page.route('**/api/decoupler/progeny**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROGENY_RESPONSE) })
  );

  // POST /api/analysis/correlation/{sessionId}
  await page.route('**/api/analysis/correlation/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CORRELATION_RESPONSE) })
  );

  // GET /api/analysis/top-correlated/{sessionId}/{gene}
  await page.route('**/api/analysis/top-correlated/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TOP_CORRELATED_RESPONSE) })
  );

  // POST /api/pseudobulk/run/{sessionId}
  await page.route('**/api/pseudobulk/run/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PSEUDOBULK_RESPONSE) })
  );

  // POST /api/visualization/violin-gene/{sessionId}/{gene}
  await page.route('**/api/visualization/violin-gene/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_VIOLIN_RESPONSE) })
  );
}

/**
 * Loads a dataset through the UI (organism → dataset → load).
 * Assumes mocks are already set up.
 */
export async function loadDatasetThroughUI(page: Page) {
  await page.selectOption('select:has(option[value=""])', 'Human');
  await page.waitForSelector('select >> nth=1');
  await page.selectOption('select >> nth=1', 'GSE181483');
  // Click the Load button
  await page.getByRole('button', { name: /load dataset/i }).click();
  // Wait for the cell count badge to appear in the header
  await page.waitForSelector('text=12,345 cells', { timeout: 10000 });
}
