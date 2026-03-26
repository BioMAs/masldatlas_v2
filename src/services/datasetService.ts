/**
 * API service for dataset operations
 */
import { apiClient } from '../lib/api';
import type {
  DatasetLoadRequest,
  DatasetLoadResponse,
  DatasetInfo,
  OrganismsResponse,
  GeneExpressionResponse,
  SubsetStats,
} from '../types/api';

export const datasetService = {
  /**
   * Get list of available organisms
   */
  async getOrganisms(): Promise<OrganismsResponse> {
    const response = await apiClient.get('/datasets/organisms');
    return response.data;
  },

  /**
   * Load a dataset
   */
  async loadDataset(request: DatasetLoadRequest): Promise<DatasetLoadResponse> {
    const response = await apiClient.post('/datasets/load', request);
    return response.data;
  },

  /**
   * Get dataset information
   */
  async getDatasetInfo(sessionId: string): Promise<DatasetInfo> {
    const response = await apiClient.get(`/datasets/info/${sessionId}`);
    return response.data;
  },

  /**
   * Get all genes (var_names) for the dataset
   */
  async getDatasetGenes(sessionId: string): Promise<string[]> {
    const response = await apiClient.get(`/datasets/genes/${sessionId}`);
    return response.data.genes;
  },

  /**
   * Get gene expression data
   */
  async getGeneExpression(
    sessionId: string,
    gene: string
  ): Promise<GeneExpressionResponse> {
    const response = await apiClient.get(
      `/datasets/gene-expression/${sessionId}/${gene}`
    );
    return response.data;
  },

  /**
   * Get stats for a subset of the dataset
   */
  async getSubsetStats(
    sessionId: string, 
    filterColumn: string, 
    filterValue: string
  ): Promise<SubsetStats> {
    const response = await apiClient.get<SubsetStats>(`/datasets/subset-stats/${sessionId}`, {
      params: { filter_column: filterColumn, filter_value: filterValue }
    });
    return response.data;
  },

  /**
   * Filter dataset
   */
  async filterDataset(
    sessionId: string,
    filterColumn: string,
    filterValues: string[]
  ): Promise<DatasetLoadResponse> {
    const response = await apiClient.post(`/datasets/filter/${sessionId}`, {
      filter_column: filterColumn,
      filter_values: filterValues,
    });
    return response.data;
  },

  /**
   * Unload dataset
   */
  async unloadDataset(sessionId: string): Promise<void> {
    await apiClient.delete(`/datasets/${sessionId}`);
  },
};
