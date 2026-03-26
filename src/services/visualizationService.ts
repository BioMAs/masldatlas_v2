/**
 * API service for visualization operations
 */
import { apiClient } from '../lib/api';
import type { VisualizationResponse } from '../types/api';

export const visualizationService = {
  /**
   * Generate UMAP plot
   */
  async generateUMAP(
    sessionId: string,
    colorBy: string = 'CellType',
    filterColumn?: string,
    filterValues?: string[]
  ): Promise<VisualizationResponse> {
    const params: any = { color_by: colorBy };
    if (filterColumn && filterValues && filterValues.length > 0) {
      params.filter_column = filterColumn;
      params.filter_values = filterValues; // Axios handles arrays by default, but check serialization if needed
    }
    const response = await apiClient.get(`/visualization/umap/${sessionId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Generate violin plot
   */
  async generateViolin(
    sessionId: string,
    genes: string[],
    groupby: string = 'CellType',
    filterColumn?: string,
    filterValues?: string[]
  ): Promise<VisualizationResponse> {
    const params: any = {
      genes: genes.join(','),
      groupby,
    };
    if (filterColumn && filterValues && filterValues.length > 0) {
      params.filter_column = filterColumn;
      params.filter_values = filterValues;
    }
    const response = await apiClient.get(`/visualization/violin/${sessionId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Generate dot plot
   */
  async generateDotPlot(
    sessionId: string,
    genes: string[],
    groupby: string = 'CellType',
    filterColumn?: string,
    filterValues?: string[]
  ): Promise<VisualizationResponse> {
    const params: any = {
      genes: genes.join(','),
      groupby,
    };
    if (filterColumn && filterValues && filterValues.length > 0) {
      params.filter_column = filterColumn;
      params.filter_values = filterValues;
    }
    const response = await apiClient.get(`/visualization/dotplot/${sessionId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Generate correlation scatter plot
   */
  async generateCorrelationScatter(
    sessionId: string,
    gene1: string,
    gene2: string,
    correlation: number,
    pvalue: number
  ): Promise<VisualizationResponse> {
    const response = await apiClient.post(
      `/visualization/correlation-scatter/${sessionId}`,
      {
        gene1,
        gene2,
        correlation,
        pvalue,
      }
    );
    return response.data;
  },

  /**
   * Generate volcano plot
   */
  async generateVolcanoPlot(
    dgeResults: any,
    logfcThreshold: number = 0.5,
    pvalThreshold: number = 0.05
  ): Promise<VisualizationResponse> {
    const response = await apiClient.post('/visualization/volcano', {
      dge_results: dgeResults,
      logfc_threshold: logfcThreshold,
      pval_threshold: pvalThreshold,
    });
    return response.data;
  },
};
