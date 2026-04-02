/**
 * API service for analysis operations
 */
import { apiClient } from '../lib/api';
import type {
  DifferentialExpressionRequest,
  DGEResponse,
  MarkerGeneRequest,
  MarkerGeneResult,
  CorrelationRequest,
  CorrelationResult,
} from '../types/api';

export const analysisService = {
  /**
   * Perform differential gene expression analysis
   */
  async differentialExpression(
    sessionId: string,
    request: DifferentialExpressionRequest
  ): Promise<DGEResponse> {
    const response = await apiClient.post(
      `/analysis/differential-expression/${sessionId}`,
      request
    );
    return response.data;
  },

  /**
   * Compute marker genes (Rank Genes Groups)
   */
  async computeMarkers(
    sessionId: string,
    request: MarkerGeneRequest
  ): Promise<MarkerGeneResult[]> {
    const response = await apiClient.post(
      `/analysis/markers/${sessionId}`,
      request
    );
    return response.data;
  },

  /**
   * Calculate gene correlation
   */
  async geneCorrelation(
    sessionId: string,
    request: CorrelationRequest
  ): Promise<CorrelationResult> {
    const response = await apiClient.post(
      `/analysis/correlation/${sessionId}`,
      request
    );
    return response.data;
  },

  /**
   * Get top correlated genes
   */
  async getTopCorrelatedGenes(
    sessionId: string,
    gene: string,
    nTop: number = 20
  ): Promise<{ gene: string; top_genes: Array<{ gene: string; correlation: number }> }> {
    const response = await apiClient.get(
      `/analysis/top-correlated/${sessionId}/${gene}`,
      { params: { n_top: nTop } }
    );
    return response.data;
  },

  /**
   * Perform functional enrichment analysis
   */
  async functionalEnrichment(
    sessionId: string,
    geneList: string[],
    database: string,
    organism: string
  ): Promise<any> {
    const response = await apiClient.post(`/enrichment/functional/${sessionId}`, {
      gene_list: geneList,
      database,
      organism
    });
    return response.data;
  },

  /**
   * Calculate pathway activity
   */
  async pathwayActivity(
    sessionId: string,
    method: string,
    organism: string
  ): Promise<any> {
    const response = await apiClient.post(`/enrichment/pathway-activity/${sessionId}`, null, {
        params: { method, organism }
    });
    return response.data;
  },

  /**
   * Run Pseudobulk analysis
   */
  async runPseudobulk(
    sessionId: string,
    sampleCol: string,
    conditionCol: string,
    refLevel: string,
    targetLevel: string,
    cellType?: string
  ): Promise<any> {
    const response = await apiClient.post(`/pseudobulk/run/${sessionId}`, {
      sample_col: sampleCol,
      condition_col: conditionCol,
      reference_level: refLevel,
      target_level: targetLevel,
      cell_type: cellType
    });
    return response.data;
  },

  /**
   * Run CollecTRI Analysis (Decoupler)
   */
  async runCollectri(deseqResults:any[], organism: string): Promise<any> {
    const response = await apiClient.post('/decoupler/collectri', {
      deseq_results: deseqResults,
      organism
    });
    return response.data;
  },

  /**
   * Run PROGENy Analysis (Decoupler)
   */
  async runProgeny(deseqResults:any[], organism: string): Promise<any> {
    const response = await apiClient.post('/decoupler/progeny', {
      deseq_results: deseqResults,
      organism
    });
    return response.data;
  },

  /**
   * Run MSigDB ORA Analysis (Decoupler)
   */
  async runMsigdb(deseqResults: any[], organism: string, collection: string = 'hallmark'): Promise<any> {
    const response = await apiClient.post('/decoupler/msigdb', {
      deseq_results: deseqResults,
      organism,
      collection,
    });
    return response.data;
  },

  /**
   * Get MSigDB running-score curve for a specific gene set
   */
  async runMsigdbRunningScore(deseqResults: any[], geneSetName: string): Promise<any> {
    const response = await apiClient.post('/decoupler/msigdb/running-score', {
      deseq_results: deseqResults,
      gene_set_name: geneSetName,
    });
    return response.data;
  },

  /**
   * Get CollecTRI volcano plot for a specific TF
   */
  async runCollectriVolcano(deseqResults: any[], tfName: string, nTargets: number = 20): Promise<any> {
    const response = await apiClient.post('/decoupler/collectri/volcano', {
      deseq_results: deseqResults,
      tf_name: tfName,
      n_targets: nTargets,
    });
    return response.data;
  },

  /**
   * Get CollecTRI network plot for a specific TF
   */
  async runCollectriNetwork(deseqResults: any[], tfName: string, nTargets: number = 20): Promise<any> {
    const response = await apiClient.post('/decoupler/collectri/network', {
      deseq_results: deseqResults,
      tf_name: tfName,
      n_targets: nTargets,
    });
    return response.data;
  },

  /**
   * Get PROGENy target genes barplot for a specific pathway
   */
  async runProgenyTargets(deseqResults: any[], pathwayName: string, nGenes: number = 50): Promise<any> {
    const response = await apiClient.post('/decoupler/progeny/targets', {
      deseq_results: deseqResults,
      pathway_name: pathwayName,
      n_genes: nGenes,
    });
    return response.data;
  },
};
