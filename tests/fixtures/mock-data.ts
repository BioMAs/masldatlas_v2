/**
 * Mock data for Playwright tests — mimics real API responses.
 * A 1×1 px transparent PNG encoded in base64 (used for image responses).
 */

export const MOCK_IMAGE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const MOCK_ORGANISMS = {
  Human: {
    status: 'Available',
    datasets: ['GSE181483'],
  },
  Mouse: {
    status: 'Available',
    datasets: ['GSE145086'],
  },
  Zebrafish: {
    status: 'Available',
    datasets: ['GSE181987'],
  },
  Integrated: {
    status: 'Available',
    datasets: ['Fibrotic Integrated Cross Species'],
  },
};

export const MOCK_SESSION_ID = 'test-session-abc123';
export const MOCK_FILTERED_SESSION_ID = 'test-filtered-session-xyz789';

export const MOCK_DATASET_INFO = {
  organism: 'Human',
  dataset_name: 'GSE181483',
  n_cells: 12345,
  n_genes: 3000,
  cell_types: ['Hepatocyte', 'Kupffer cell', 'Stellate cell', 'Endothelial cell', 'B cell'],
  metadata_columns: ['cell_type', 'sample', 'condition', 'batch'],
  available_layers: ['X', 'counts'],
  has_umap: true,
  obs_keys: ['cell_type', 'sample', 'condition', 'batch'],
  var_keys: ['gene_ids', 'highly_variable'],
};

export const MOCK_DATASET_LOAD_RESPONSE = {
  success: true,
  session_id: MOCK_SESSION_ID,
  info: MOCK_DATASET_INFO,
};

export const MOCK_GENES = [
  'GAPDH', 'ACTB', 'TNF', 'IL6', 'TGFB1', 'COL1A1', 'ACTA2',
  'MKI67', 'PCNA', 'VIM', 'CDH1', 'EPCAM', 'ALB', 'CYP3A4',
];

export const MOCK_UMAP_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
  color_by: 'cell_type',
};

export const MOCK_VIOLIN_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
};

export const MOCK_DOTPLOT_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
};

export const MOCK_MARKERS: object[] = [
  { gene: 'ALB',    score: 8.5,  avg_log2FC: 2.1,  p_val_adj: 1e-15, cluster: 'Hepatocyte' },
  { gene: 'CYP3A4', score: 7.8,  avg_log2FC: 1.9,  p_val_adj: 2e-12, cluster: 'Hepatocyte' },
  { gene: 'CD68',   score: 6.2,  avg_log2FC: 1.5,  p_val_adj: 5e-10, cluster: 'Kupffer cell' },
  { gene: 'COL1A1', score: 5.9,  avg_log2FC: 1.3,  p_val_adj: 8e-9,  cluster: 'Stellate cell' },
  { gene: 'PECAM1', score: 5.1,  avg_log2FC: 1.1,  p_val_adj: 1e-7,  cluster: 'Endothelial cell' },
];

export const MOCK_DGE_RESPONSE = {
  success: true,
  n_genes: 4,
  results: [
    { names: 'TNF',    scores: 5.2,  logfoldchanges: 2.5,  pvals: 1e-8,  pvals_adj: 5e-7  },
    { names: 'IL6',    scores: 4.8,  logfoldchanges: 2.1,  pvals: 2e-7,  pvals_adj: 8e-6  },
    { names: 'TGFB1',  scores: -3.1, logfoldchanges: -1.8, pvals: 5e-6,  pvals_adj: 2e-4  },
    { names: 'GAPDH',  scores: 0.2,  logfoldchanges: 0.05, pvals: 0.82,  pvals_adj: 0.95  },
  ],
};

export const MOCK_VOLCANO_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
};

export const MOCK_ENRICHMENT_RESPONSE = {
  success: true,
  results: [
    { term: 'GO:0006954 inflammatory response', p_value: 1e-8, adjusted_p_value: 5e-7, gene_count: 12, gene_ratio: 0.15, genes: 'TNF,IL6,IL1B' },
    { term: 'GO:0001816 cytokine production',   p_value: 2e-7, adjusted_p_value: 8e-6, gene_count: 8,  gene_ratio: 0.10, genes: 'TNF,IL6'     },
    { term: 'KEGG:hsa05161 Hepatitis B',        p_value: 5e-6, adjusted_p_value: 2e-4, gene_count: 6,  gene_ratio: 0.08, genes: 'TGFB1,TNF'  },
  ],
};

export const MOCK_COLLECTRI_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
  results: [
    { source: 'NF-kB', activity: 2.3, p_value: 0.001 },
    { source: 'STAT3',  activity: 1.8, p_value: 0.005 },
  ],
};

export const MOCK_PROGENY_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
  results: [
    { pathway: 'TNFa',   activity: 3.1, p_value: 0.0001 },
    { pathway: 'TGFb',   activity: 2.5, p_value: 0.0005 },
    { pathway: 'EGFR',   activity: -1.2, p_value: 0.05   },
  ],
};

export const MOCK_MSIGDB_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
  results: [
    { geneset: 'HALLMARK_TNFA_SIGNALING_VIA_NFKB', activity: 2.8, p_value: 0.0002 },
    { geneset: 'HALLMARK_INFLAMMATORY_RESPONSE',    activity: 2.1, p_value: 0.001  },
  ],
};

export const MOCK_FILTER_RESPONSE = {
  success: true,
  session_id: MOCK_FILTERED_SESSION_ID,
  info: {
    ...MOCK_DATASET_INFO,
    n_cells: 5432,
    cell_types: ['Hepatocyte', 'Kupffer cell'],
  },
};

export const MOCK_CORRELATION_RESPONSE = {
  gene1: 'TNF',
  gene2: 'IL6',
  correlation: 0.72,
  pvalue: 1e-15,
  method: 'spearman',
  n_cells: 1200,
  expr1: [0.1, 0.5, 1.2, 2.3],
  expr2: [0.2, 0.6, 1.1, 1.9],
};

export const MOCK_SCATTER_RESPONSE = {
  success: true,
  image: MOCK_IMAGE_BASE64,
};

export const MOCK_TOP_CORRELATED_RESPONSE = {
  gene: 'TNF',
  top_genes: [
    { gene: 'IL6',   correlation: 0.85 },
    { gene: 'IL1B',  correlation: 0.78 },
    { gene: 'CXCL8', correlation: 0.71 },
  ],
};

export const MOCK_PSEUDOBULK_RESPONSE = {
  success: true,
  n_genes: 3,
  results: [
    { names: 'TNF',   scores: 4.1,  logfoldchanges: 1.8,  pvals: 1e-6,  pvals_adj: 5e-5  },
    { names: 'IL6',   scores: 3.5,  logfoldchanges: 1.5,  pvals: 3e-5,  pvals_adj: 1e-3  },
    { names: 'GAPDH', scores: 0.1,  logfoldchanges: 0.02, pvals: 0.91,  pvals_adj: 0.97  },
  ],
};

export const MOCK_SUBSET_STATS = {
  n_cells: 3521,
  n_genes: 2800,
};
