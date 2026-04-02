/**
 * Type definitions for API requests and responses
 */

export type OrganismType = 'Human' | 'Mouse' | 'Zebrafish' | 'Integrated';

export type TestMethod = 'wilcoxon' | 't-test' | 'logreg';

export type CorrelationMethod = 'spearman' | 'pearson';

export type EnrichmentDatabase = 
  | 'GO_Biological_Process'
  | 'Gene_Ontology'
  | 'KEGG'
  | 'Reactome'
  | 'WikiPathways';

// Dataset types
export interface DatasetLoadRequest {
  organism: OrganismType;
  dataset_name: string;
  size_option?: string;
}

export interface DatasetInfo {
  organism: OrganismType; // Added to match backend and usages
  dataset_name?: string;  // Added as optional or required based on backend
  n_cells: number;
  n_genes: number;
  cell_types: string[];
  metadata_columns: string[];
  available_layers: string[];
  has_umap: boolean;
  obs_keys: string[];
  var_keys: string[];
}

export interface DatasetLoadResponse {
  success: boolean;
  session_id: string;
  info: DatasetInfo;
}

export interface OrganismData {
  status: string;
  description: string;
  datasets: string[];
}

export interface OrganismsResponse {
  [key: string]: OrganismData;
}

// Gene expression types
export interface GeneExpressionResponse {
  gene: string;
  expression: number[];
  umap_coordinates?: {
    x: number[];
    y: number[];
  };
  cell_types?: string[];
}

// Differential expression types
export interface DifferentialExpressionRequest {
  group1: string;
  group2: string;
  groupby?: string;
  method?: TestMethod;
  min_logfc?: number;
  max_pval?: number;
}

export interface MarkerGeneRequest {
  groupby?: string;
  method?: TestMethod;
  n_genes?: number;
}

export interface MarkerGeneResult {
  gene: string;
  score: number;
  avg_log2FC: number;
  p_val_adj: number;
  cluster: string;
}

export interface DGEResult {
  names: string;
  scores: number;
  logfoldchanges: number;
  pvals: number;
  pvals_adj: number;
}

export interface DGEResponse {
  success: boolean;
  n_genes: number;
  results: DGEResult[];
}

// Client-side visualization data types
export interface UMAPDataResponse {
  success: boolean;
  x: number[];
  y: number[];
  categories: (string | number)[];
  unique_categories: string[];
  color_by: string;
  is_continuous: boolean;
  n_cells: number;
}

export interface ViolinDataResponse {
  success: boolean;
  genes: string[];
  groups: string[];
  data: Record<string, Record<string, number[]>>;
}

export interface DotPlotDataResponse {
  success: boolean;
  genes: string[];
  groups: string[];
  mean_expression: Record<string, Record<string, number>>;
  fraction_expressing: Record<string, Record<string, number>>;
}

export interface SubsetStats {
  n_cells: number;
  n_genes: number;
}

// Correlation types
export interface CorrelationRequest {
  gene1: string;
  gene2: string;
  method?: CorrelationMethod;
  remove_zeros?: boolean;
}

export interface CorrelationResult {
  gene1: string;
  gene2: string;
  correlation: number;
  pvalue: number;
  method: string;
  n_cells: number;
  expr1: number[];
  expr2: number[];
}

// Visualization types
export interface VisualizationResponse {
  success: boolean;
  image: string; // base64 encoded
  color_by?: string;
  genes?: string[];
}
