import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Network, Activity, BookOpen, GitBranch, Target } from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { DotPlot } from './plots/DotPlot';
import { exportToCSV } from '../utils/exportToCSV';
import { ActionButtons } from './ui/ActionButtons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface DecouplerPanelProps {
  deseqResults: any[];
  organism: string;
}

type AnalysisType = 'collectri' | 'progeny' | 'msigdb';
type CollectriView = 'barplot' | 'volcano' | 'network';
type ProgenyView = 'barplot' | 'targets';

export const DecouplerPanel: React.FC<DecouplerPanelProps> = ({
  deseqResults,
  organism
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisType>('collectri');
  const [selectedGeneSet, setSelectedGeneSet] = useState<string | null>(null);
  const [selectedTF, setSelectedTF] = useState<string | null>(null);
  const [collectriView, setCollectriView] = useState<CollectriView>('barplot');
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [_progenyView, setProgenyView] = useState<ProgenyView>('barplot');

  // CollecTRI Analysis
  const collectriMutation = useMutation({
    mutationFn: () => analysisService.runCollectri(deseqResults, organism)
  });

  // PROGENy Analysis
  const progenyMutation = useMutation({
    mutationFn: () => analysisService.runProgeny(deseqResults, organism)
  });

  // MSigDB ORA Analysis
  const msigdbMutation = useMutation({
    mutationFn: () => analysisService.runMsigdb(deseqResults, organism)
  });

  // MSigDB Running Score
  const msigdbRunningScoreMutation = useMutation({
    mutationFn: (geneSetName: string) =>
      analysisService.runMsigdbRunningScore(deseqResults, geneSetName)
  });

  // CollecTRI Volcano
  const collectriVolcanoMutation = useMutation({
    mutationFn: (tfName: string) =>
      analysisService.runCollectriVolcano(deseqResults, tfName)
  });

  // CollecTRI Network
  const collectriNetworkMutation = useMutation({
    mutationFn: (tfName: string) =>
      analysisService.runCollectriNetwork(deseqResults, tfName)
  });

  // PROGENy Targets
  const progenyTargetsMutation = useMutation({
    mutationFn: (pathwayName: string) =>
      analysisService.runProgenyTargets(deseqResults, pathwayName)
  });

  // Helper to format data for DotPlot
  const formatForDotPlot = (data: any[], _type: AnalysisType) => {
    if (!data) return [];
    
    // Decoupler returns score (activity) and p_value
    // We want to visualize:
    // Y: Source (TF/Pathway)
    // X: Score (Activity)
    // Color: P-value
    // Size: Constant or proportional to something else? 
    // DotPlot expects: term, padj, count, generatio.
    
    // Adaptation for Activity Plot using "DotPlot" component logic:
    // generatio -> mapped to Score (X axis)
    // count -> size (placeholder 10)
    // padj -> color
    
    return data.map((item: any) => ({
      term: item.source, 
      padj: item.p_value,
      count: 10, 
      generatio: item.score, 
      log2FoldChange: item.score 
    }));
  };

  const getColDefs = (type: AnalysisType): ColDef[] => [
    { field: 'source', headerName: type === 'collectri' ? 'Transcription Factor' : 'Pathway', sortable: true, filter: true, flex: 1 },
    { field: 'score', headerName: 'Activity Score', sortable: true, filter: 'agNumberColumnFilter', flex: 1, valueFormatter: (p: any) => p.value?.toFixed(2) },
    { field: 'p_value', headerName: 'P-Value', sortable: true, filter: 'agNumberColumnFilter', flex: 1, valueFormatter: (p: any) => p.value?.toExponential(2) },
  ];

  const currentData = activeTab === 'collectri'
    ? collectriMutation.data?.tf_scores
    : activeTab === 'progeny'
      ? progenyMutation.data?.pathway_scores
      : msigdbMutation.data?.enrichment_scores;
  const isPending = activeTab === 'collectri'
    ? collectriMutation.isPending
    : activeTab === 'progeny'
      ? progenyMutation.isPending
      : msigdbMutation.isPending;
  const runAnalysis = activeTab === 'collectri'
    ? collectriMutation.mutate
    : activeTab === 'progeny'
      ? progenyMutation.mutate
      : msigdbMutation.mutate;
  const hasRun = activeTab === 'collectri'
    ? !!collectriMutation.data
    : activeTab === 'progeny'
      ? !!progenyMutation.data
      : !!msigdbMutation.data;

  // Auto-run if not run yet? No, explicit action is better for heavy computation.

  return (
    <div className="bg-white rounded-lg p-6">
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('collectri')}
          className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'collectri'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Network className="w-4 h-4" />
          Transcription Factors (DoRothEA/CollecTRI)
        </button>
        
        <button
          onClick={() => setActiveTab('progeny')}
          className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'progeny'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Pathways (PROGENy)
        </button>

        <button
          onClick={() => setActiveTab('msigdb')}
          className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'msigdb'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Gene Sets (MSigDB Hallmarks)
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <p className="text-sm text-gray-600">
             {activeTab === 'collectri' 
                ? "Infer transcription factor activities from the expression of their target genes." 
                : activeTab === 'progeny'
                  ? "Infer pathway activities based on the expression of footprint genes."
                  : "Over-Representation Analysis on MSigDB Hallmark gene sets."}
           </p>
           
           <ActionButtons 
                onDownloadCSV={() => currentData && exportToCSV(currentData, `${activeTab}_results`)}
           />
        </div>

        {!hasRun && (
            <div className="text-center py-10">
                <button
                onClick={() => runAnalysis()}
                disabled={isPending || !deseqResults || deseqResults.length === 0}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
                >
                {isPending ? (
                    <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Running Analysis...
                    </>
                ) : (
                    `Run ${
                      activeTab === 'collectri' ? 'TF'
                      : activeTab === 'progeny' ? 'Pathway'
                      : 'MSigDB'
                    } Analysis`
                )}
                </button>
                {(!deseqResults || deseqResults.length === 0) && (
                    <p className="text-red-500 mt-2 text-sm">Please run Differential Expression first.</p>
                )}
            </div>
        )}

        {/* ── CollecTRI ── */}
        {hasRun && currentData && activeTab === 'collectri' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table */}
              <div className="h-[500px] border rounded-lg shadow-sm bg-gray-50 overflow-hidden flex flex-col">
                <h4 className="font-semibold p-3 border-b bg-white">TF Activity Table</h4>
                <div className="flex-1 ag-theme-alpine">
                  <AgGridReact
                    theme="legacy"
                    rowData={currentData}
                    columnDefs={getColDefs('collectri')}
                    pagination={true}
                    paginationPageSize={20}
                    domLayout="normal"
                    rowSelection="single"
                    onRowClicked={(e) => {
                      if (e.data?.source) {
                        setSelectedTF(e.data.source);
                        setCollectriView('barplot');
                      }
                    }}
                    rowStyle={{ cursor: 'pointer' }}
                  />
                </div>
                <p className="text-xs text-gray-400 px-3 py-2 border-t">Click a row to inspect TF targets</p>
              </div>
              {/* Barplot */}
              <div className="border rounded-lg shadow-sm bg-white p-2">
                {collectriMutation.data?.barplot_image ? (
                  <img src={collectriMutation.data.barplot_image} alt="CollecTRI barplot" className="w-full h-auto rounded" />
                ) : (
                  <DotPlot
                    data={formatForDotPlot(currentData.slice(0, 25), 'collectri')}
                    title="Top 25 Transcription Factors"
                    colorMetric="padj"
                  />
                )}
              </div>
            </div>

            {/* TF Detail panel */}
            {selectedTF && (
              <div className="border rounded-lg bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">
                    TF Details — <span className="text-indigo-600">{selectedTF}</span>
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCollectriView('volcano');
                        if (!collectriVolcanoMutation.data || collectriVolcanoMutation.data.tf !== selectedTF) {
                          collectriVolcanoMutation.mutate(selectedTF!);
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        collectriView === 'volcano'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Volcano
                    </button>
                    <button
                      onClick={() => {
                        setCollectriView('network');
                        if (!collectriNetworkMutation.data || collectriNetworkMutation.data.tf !== selectedTF) {
                          collectriNetworkMutation.mutate(selectedTF!);
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors flex items-center gap-1 ${
                        collectriView === 'network'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <GitBranch className="w-3 h-3" />
                      Network
                    </button>
                  </div>
                </div>

                {/* Volcano */}
                {collectriView === 'volcano' && (
                  <>{
                    collectriVolcanoMutation.isPending ? (
                      <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : collectriVolcanoMutation.data?.volcano_image ? (
                      <img src={collectriVolcanoMutation.data.volcano_image} alt={`Volcano — ${selectedTF}`} className="w-full h-auto rounded" />
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">Click <strong>Volcano</strong> above to generate the plot for <strong>{selectedTF}</strong></p>
                    )
                  }</>
                )}

                {/* Network */}
                {collectriView === 'network' && (
                  <>{
                    collectriNetworkMutation.isPending ? (
                      <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : collectriNetworkMutation.data?.network_image ? (
                      <img src={collectriNetworkMutation.data.network_image} alt={`Network — ${selectedTF}`} className="w-full h-auto rounded" />
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">Generating network for <strong>{selectedTF}</strong>…</p>
                    )
                  }</>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PROGENy ── */}
        {hasRun && currentData && activeTab === 'progeny' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table */}
              <div className="h-[500px] border rounded-lg shadow-sm bg-gray-50 overflow-hidden flex flex-col">
                <h4 className="font-semibold p-3 border-b bg-white">Pathway Activity Table</h4>
                <div className="flex-1 ag-theme-alpine">
                  <AgGridReact
                    theme="legacy"
                    rowData={currentData}
                    columnDefs={getColDefs('progeny')}
                    pagination={true}
                    paginationPageSize={20}
                    domLayout="normal"
                    rowSelection="single"
                    onRowClicked={(e) => {
                      if (e.data?.source) {
                        setSelectedPathway(e.data.source);
                        setProgenyView('targets');
                        progenyTargetsMutation.mutate(e.data.source);
                      }
                    }}
                    rowStyle={{ cursor: 'pointer' }}
                  />
                </div>
                <p className="text-xs text-gray-400 px-3 py-2 border-t">Click a pathway to view target genes</p>
              </div>
              {/* Barplot */}
              <div className="border rounded-lg shadow-sm bg-white p-2">
                {progenyMutation.data?.barplot_image ? (
                  <img src={progenyMutation.data.barplot_image} alt="PROGENy barplot" className="w-full h-auto rounded" />
                ) : (
                  <DotPlot
                    data={formatForDotPlot(currentData.slice(0, 25), 'progeny')}
                    title="Top 25 Pathways"
                    colorMetric="padj"
                  />
                )}
              </div>
            </div>

            {/* Pathway Targets panel */}
            {selectedPathway && (
              <div className="border rounded-lg bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-semibold text-sm">
                    Pathway Targets — <span className="text-indigo-600">{selectedPathway}</span>
                  </h4>
                </div>
                {progenyTargetsMutation.isPending ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : progenyTargetsMutation.data?.targets_image ? (
                  <img
                    src={progenyTargetsMutation.data.targets_image}
                    alt={`PROGENy targets — ${selectedPathway}`}
                    className="w-full h-auto rounded"
                  />
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">No targets data available</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* MSigDB specific view */}
        {hasRun && activeTab === 'msigdb' && msigdbMutation.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dotplot image from backend */}
              <div className="border rounded-lg bg-white p-2">
                {msigdbMutation.data.dotplot_image ? (
                  <img
                    src={msigdbMutation.data.dotplot_image}
                    alt="MSigDB Hallmarks dotplot"
                    className="w-full h-auto rounded"
                  />
                ) : (
                  <p className="text-xs text-gray-400 p-4 text-center">No dotplot available</p>
                )}
              </div>

              {/* Table */}
              <div className="h-[500px] border rounded-lg shadow-sm bg-gray-50 overflow-hidden flex flex-col">
                <h4 className="font-semibold p-3 border-b bg-white">Enrichment Results ({msigdbMutation.data.n_gene_sets} sets)</h4>
                <div className="flex-1 ag-theme-alpine">
                  <AgGridReact
                    theme="legacy"
                    rowData={msigdbMutation.data.enrichment_scores}
                    columnDefs={[
                      { field: 'source', headerName: 'Gene Set', sortable: true, filter: true, flex: 2 },
                      { field: 'score', headerName: 'Score', sortable: true, filter: 'agNumberColumnFilter', flex: 1, valueFormatter: (p: any) => p.value?.toFixed(3) },
                      { field: 'p_value', headerName: 'P-Value', sortable: true, filter: 'agNumberColumnFilter', flex: 1, valueFormatter: (p: any) => p.value?.toExponential(2) },
                    ]}
                    pagination={true}
                    paginationPageSize={20}
                    rowSelection="single"
                    onRowClicked={(e) => {
                      if (e.data?.source) {
                        setSelectedGeneSet(e.data.source);
                        msigdbRunningScoreMutation.mutate(e.data.source);
                      }
                    }}
                    rowStyle={{ cursor: 'pointer' }}
                    domLayout="normal"
                  />
                </div>
                <p className="text-xs text-gray-400 px-3 py-2 border-t">Click a row to view the GSEA running score curve</p>
              </div>
            </div>

            {/* Running Score curve */}
            {(selectedGeneSet || msigdbRunningScoreMutation.isPending) && (
              <div className="border rounded-lg bg-white p-4">
                <h4 className="font-semibold mb-3 text-sm">
                  Running Score — <span className="text-indigo-600">{selectedGeneSet}</span>
                </h4>
                {msigdbRunningScoreMutation.isPending ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : msigdbRunningScoreMutation.data?.image_b64 ? (
                  <img
                    src={msigdbRunningScoreMutation.data.image_b64}
                    alt={`Running score — ${selectedGeneSet}`}
                    className="w-full h-auto rounded"
                  />
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">No running score data</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
