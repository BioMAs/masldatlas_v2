/**
 * React Query hooks for dataset operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetService } from '../services/datasetService';
import { visualizationService } from '../services/visualizationService';
import type { DatasetLoadRequest } from '../types/api';

export const useOrganisms = () => {
  return useQuery({
    queryKey: ['organisms'],
    queryFn: () => datasetService.getOrganisms(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLoadDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DatasetLoadRequest) =>
      datasetService.loadDataset(request),
    onSuccess: (data) => {
      queryClient.setQueryData(['dataset', data.session_id], data.info);
    },
  });
};

export const useDatasetInfo = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['dataset', sessionId],
    queryFn: () => datasetService.getDatasetInfo(sessionId!),
    enabled: !!sessionId,
  });
};

export const useDatasetGenes = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['dataset-genes', sessionId],
    queryFn: () => datasetService.getDatasetGenes(sessionId!),
    enabled: !!sessionId,
    staleTime: Infinity, // Gene list doesn't change for a loaded dataset
  });
};

export const useGeneExpression = (sessionId: string | null, gene: string | null) => {
  return useQuery({
    queryKey: ['gene-expression', sessionId, gene],
    queryFn: () => datasetService.getGeneExpression(sessionId!, gene!),
    enabled: !!sessionId && !!gene,
  });
};

export const useSubsetStats = (sessionId: string | null, filterColumn: string, filterValue: string | null) => {
  return useQuery({
    queryKey: ['subset-stats', sessionId, filterColumn, filterValue],
    queryFn: () => datasetService.getSubsetStats(sessionId!, filterColumn, filterValue!),
    enabled: !!sessionId && !!filterValue,
  });
};

export const useUMAPVisualization = (
  sessionId: string | null, 
  colorBy: string = 'CellType',
  filterColumn?: string,
  filterValues?: string[]
) => {
  return useQuery({
    queryKey: ['umap-data', sessionId, colorBy, filterColumn, filterValues],
    queryFn: () => visualizationService.getUMAPData(sessionId!, colorBy, filterColumn, filterValues),
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useViolinVisualization = (
  sessionId: string | null,
  genes: string[],
  groupby: string = 'CellType',
  filterColumn?: string,
  filterValues?: string[]
) => {
  return useQuery({
    queryKey: ['violin-visualization', sessionId, genes, groupby, filterColumn, filterValues],
    queryFn: () => visualizationService.generateViolin(sessionId!, genes, groupby, filterColumn, filterValues),
    enabled: !!sessionId && genes.length > 0,
    staleTime: 10 * 60 * 1000,
  });
};

export const useViolinData = (
  sessionId: string | null,
  genes: string[],
  groupby: string = 'CellType',
  filterColumn?: string,
  filterValues?: string[]
) => {
  return useQuery({
    queryKey: ['violin-data', sessionId, genes, groupby, filterColumn, filterValues],
    queryFn: () => visualizationService.getViolinData(sessionId!, genes, groupby, filterColumn, filterValues),
    enabled: !!sessionId && genes.length > 0,
    staleTime: 10 * 60 * 1000,
  });
};

export const useDotPlotVisualization = (sessionId: string | null, genes: string[], groupby: string = 'CellType') => {
  return useQuery({
    queryKey: ['dotplot-data', sessionId, genes, groupby],
    queryFn: () => visualizationService.getDotPlotData(sessionId!, genes, groupby),
    enabled: !!sessionId && genes.length > 0,
    staleTime: 10 * 60 * 1000,
  });
};
