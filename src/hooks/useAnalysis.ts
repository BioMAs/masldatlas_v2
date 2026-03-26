/**
 * React Query hooks for analysis operations
 */
import { useMutation } from '@tanstack/react-query';
import { analysisService } from '../services/analysisService';
import type { DifferentialExpressionRequest, CorrelationRequest, MarkerGeneRequest } from '../types/api';

export const useMarkerGenes = (sessionId: string) => {
  return useMutation({
    mutationFn: (request: MarkerGeneRequest) =>
      analysisService.computeMarkers(sessionId, request),
  });
};

export const useDifferentialExpression = (sessionId: string) => {
  return useMutation({
    mutationFn: (request: DifferentialExpressionRequest) =>
      analysisService.differentialExpression(sessionId, request),
  });
};

export const useGeneCorrelation = (sessionId: string) => {
  return useMutation({
    mutationFn: (request: CorrelationRequest) =>
      analysisService.geneCorrelation(sessionId, request),
  });
};

export const useTopCorrelatedGenes = () => {
  return useMutation({
    mutationFn: ({
      sessionId,
      gene,
      nTop = 20,
    }: {
      sessionId: string;
      gene: string;
      nTop?: number;
    }) => analysisService.getTopCorrelatedGenes(sessionId, gene, nTop),
  });
};

export const useFunctionalEnrichment = (sessionId: string) => {
  return useMutation({
    mutationFn: ({
      geneList,
      database,
      organism
    }: {
      geneList: string[];
      database: string;
      organism: string;
    }) => analysisService.functionalEnrichment(sessionId, geneList, database, organism),
  });
};

export const usePathwayActivity = (sessionId: string) => {
  return useMutation({
    mutationFn: ({
      method,
      organism
    }: {
      method: string;
      organism: string;
    }) => analysisService.pathwayActivity(sessionId, method, organism),
  });
};

export const usePseudobulk = (sessionId: string) => {
  return useMutation({
    mutationFn: (params: {
      sampleCol: string;
      conditionCol: string;
      refLevel: string;
      targetLevel: string;
      cellType?: string;
    }) => analysisService.runPseudobulk(
      sessionId, 
      params.sampleCol, 
      params.conditionCol, 
      params.refLevel, 
      params.targetLevel, 
      params.cellType
    ),
  });
};
