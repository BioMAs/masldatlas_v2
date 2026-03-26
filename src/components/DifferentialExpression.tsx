/**
 * Differential Expression Analysis Component
 */
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDifferentialExpression } from '../hooks/useAnalysis';
import { useDatasetInfo } from '../hooks/useDataset';
import { useFullscreen } from '../hooks/useFullscreen';
import { ActionButtons } from './ui/ActionButtons';
import { FullscreenModal } from './ui/FullscreenModal';
import { EnrichmentPanel } from './EnrichmentPanel';
import { DecouplerPanel } from './DecouplerPanel';
import { VolcanoPlot } from './plots/VolcanoPlot';
import { RankGenesPlot } from './plots/RankGenesPlot';
import { exportToCSV } from '../utils/exportToCSV';
import { exportToExcel } from '../utils/exportToExcel';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { Settings, X, RefreshCw, ChevronRight, Download } from 'lucide-react';
import { downloadImageAsPNG } from '../utils/downloadImage';
import { apiClient } from '../lib/api';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface DifferentialExpressionProps {
  sessionId: string;
  filteredSessionId?: string | null;
  cellTypes: string[];
}

type MainTab = 'deg';
type GroupByMode = 'clusters' | 'groups';
type DataScope = 'all' | 'filtered';
type BottomPanel = 'enrichment' | 'decoupler';

export function DifferentialExpression({ sessionId, filteredSessionId, cellTypes }: DifferentialExpressionProps) {
  const { data: datasetInfo } = useDatasetInfo(sessionId);

  // Configuration State
  const [group1, setGroup1] = useState('');
  const [group2, setGroup2] = useState('');
  const [method, setMethod] = useState<'wilcoxon' | 't-test' | 'logreg'>('wilcoxon');
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('clusters');
  const [groupByColumn, setGroupByColumn] = useState('CellType');

  // Data Scope (All Data vs Filtered clusters)
  const [dataScope, setDataScope] = useState<DataScope>('all');
  const activeSessionId = dataScope === 'filtered' && filteredSessionId ? filteredSessionId : sessionId;

  // Visual Filters (applied on frontend for Volcano/Table, but we fetch ALL data)
  const [minLogFC, setMinLogFC] = useState(0.5);
  const [maxPval, setMaxPval] = useState(0.05);

  // View State
  const [activeTab, setActiveTab] = useState<MainTab>('deg');
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('enrichment');

  // Violin slide-in panel
  const [selectedGene, setSelectedGene] = useState<string | null>(null);

  // Data Query — keyed on activeSessionId
  const { mutate: runDGE, data: dgeData, isPending, isSuccess, reset: resetDGE } = useDifferentialExpression(activeSessionId);
  const { isFullscreen, openFullscreen, closeFullscreen } = useFullscreen();

  // Reset DGE results when scope switches
  useEffect(() => {
    resetDGE();
    setSelectedGene(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // Violin-gene query (lazy — only fetches when selectedGene is set)
  const { data: violinData, isFetching: loadingViolin } = useQuery({
    queryKey: ['violin-gene', activeSessionId, selectedGene],
    queryFn: () =>
      apiClient
        .get(`/visualization/violin-gene/${activeSessionId}/${selectedGene}`, {
          params: { groupby: groupByMode === 'clusters' ? 'CellType' : groupByColumn },
        })
        .then((r) => r.data),
    enabled: !!selectedGene && isSuccess,
  });

  // Filtered metadata columns (no QC/numeric junk)
  const metadataColumns = useMemo(() => {
    return (datasetInfo?.metadata_columns || []).filter(
      (c) =>
        !['n_genes', 'n_counts', 'pct_', 'log1p_', 'total_', '_score', 'top_genes'].some((bad) =>
          c.toLowerCase().includes(bad)
        )
    );
  }, [datasetInfo]);

  const handleRun = () => {
    if (!group1 || !group2) return;
    runDGE({
      group1,
      group2,
      groupby: groupByMode === 'clusters' ? 'CellType' : groupByColumn,
      method,
      min_logfc: 0,
      max_pval: 1.0,
    });
    setSelectedGene(null);
  };

  const organism = sessionId.split('_')[0].toLowerCase();

  // Map Scanpy results to standard format
  const mappedResults = useMemo(() => {
    if (!dgeData?.results) return [];
    return dgeData.results.map((r: any) => ({
      gene: r.names,
      log2FoldChange: r.logfoldchanges,
      pvalue: r.pvals,
      padj: r.pvals_adj,
      score: r.scores,
    }));
  }, [dgeData]);

  const filteredResults = useMemo(() => {
    return mappedResults.filter(
      (r) =>
        Math.abs(r.log2FoldChange) >= minLogFC &&
        (r.padj !== undefined ? r.padj <= maxPval : r.pvalue <= maxPval)
    );
  }, [mappedResults, minLogFC, maxPval]);

  const handleDownloadCSV = () => {
    if (mappedResults.length > 0) exportToCSV(mappedResults, `dge_${group1}_vs_${group2}`);
  };
  const handleDownloadExcel = () => {
    if (mappedResults.length > 0) exportToExcel(mappedResults, `dge_${group1}_vs_${group2}`, 'DGE Results');
  };

  const columnDefs: ColDef[] = [
    { field: 'gene', headerName: 'Gene', sortable: true, filter: true, pinned: 'left', width: 150 },
    {
      field: 'log2FoldChange',
      headerName: 'Log2 FC',
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: any) => params.value?.toFixed(3),
      cellStyle: (params: any) => {
        if (params.value > 0) return { color: '#dc2626' };
        if (params.value < 0) return { color: '#2563eb' };
        return null;
      },
    },
    { field: 'pvalue', headerName: 'P-value', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params: any) => params.value?.toExponential(2) },
    { field: 'padj', headerName: 'Adj. P-value', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params: any) => params.value?.toExponential(2) },
    { field: 'score', headerName: 'Score', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (params: any) => params.value?.toFixed(3), hide: true },
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-50 text-gray-900 rounded-lg overflow-hidden border">

      {/* ───── Sidebar: Configuration ───── */}
      <div className={`${isConfigOpen ? 'w-64' : 'w-0'} bg-white border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}>
        {isConfigOpen && (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-700">Configuration</h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              {/* ── Data Scope toggle (only when a filtered session exists) ── */}
              {filteredSessionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Scope</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {(['all', 'filtered'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setDataScope(s)}
                        className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                          dataScope === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {s === 'all' ? 'All Data' : 'Filtered Clusters'}
                      </button>
                    ))}
                  </div>
                  {dataScope === 'filtered' && (
                    <p className="text-xs text-indigo-500 mt-1">Using filtered cluster subset</p>
                  )}
                </div>
              )}

              {/* ── Compare By toggle ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compare By</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {(['clusters', 'groups'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setGroupByMode(m);
                        setGroup1('');
                        setGroup2('');
                        if (m === 'clusters') setGroupByColumn('CellType');
                      }}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                        groupByMode === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {m === 'clusters' ? 'Cell Types' : 'Groups'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── When Groups mode: pick the column ── */}
              {groupByMode === 'groups' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group By Column</label>
                  <select
                    value={groupByColumn}
                    onChange={(e) => { setGroupByColumn(e.target.value); setGroup1(''); setGroup2(''); }}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                  >
                    {metadataColumns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Group selection ── */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group 1 (Reference)</label>
                  {groupByMode === 'clusters' ? (
                    <select value={group1} onChange={(e) => setGroup1(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm">
                      <option value="">Select group...</option>
                      {cellTypes.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={group1}
                      onChange={(e) => setGroup1(e.target.value)}
                      placeholder="e.g. Control, Healthy..."
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm px-2 py-1.5"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group 2 (Target)</label>
                  {groupByMode === 'clusters' ? (
                    <select value={group2} onChange={(e) => setGroup2(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm">
                      <option value="">Select group...</option>
                      {cellTypes.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={group2}
                      onChange={(e) => setGroup2(e.target.value)}
                      placeholder="e.g. NASH, MASLD..."
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm px-2 py-1.5"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statistical Method</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full text-sm border-gray-300 rounded-md shadow-sm">
                    <option value="wilcoxon">Wilcoxon (Rank Sum)</option>
                    <option value="t-test">T-test</option>
                    <option value="logreg">Logistic Regression</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t">
                <button
                  onClick={handleRun}
                  disabled={!group1 || !group2 || isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Running Analysis...' : 'Run Differential Expression'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Full dataset used for accuracy.
                </p>
              </div>

              {isSuccess && (
                <div className="pt-4 border-t space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900">Result Filters</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Min Log2 FC: {minLogFC}</label>
                    <input type="range" min="0" max="5" step="0.1" value={minLogFC} onChange={(e) => setMinLogFC(parseFloat(e.target.value))} className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Max P-value: {maxPval}</label>
                    <input type="range" min="0.001" max="0.1" step="0.001" value={maxPval} onChange={(e) => setMaxPval(parseFloat(e.target.value))} className="w-full mt-1" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ───── Main Content ───── */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {!isConfigOpen && (
          <div className="p-2 border-b bg-white">
            <button onClick={() => setIsConfigOpen(true)} className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-white border-b px-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('deg')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'deg' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Differential Expression (DEG)
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {!isSuccess ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              {isPending ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              ) : (
                <>
                  <div className="bg-gray-100 p-4 rounded-full">
                    <Settings className="w-8 h-8 text-gray-400" />
                  </div>
                  <p>Select groups on the left and click "Run Differential Expression".</p>
                </>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'deg' && (
                <div className="space-y-6">
                  {/* Summary Band */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-700">Analysis Complete</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-600">
                        {group2} vs {group1}
                        {groupByMode === 'groups' && (
                          <span className="ml-1 text-xs text-indigo-500 font-medium">({groupByColumn})</span>
                        )}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-600">{mappedResults.length} genes tested</span>
                      {dataScope === 'filtered' && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">Filtered Clusters</span>
                        </>
                      )}
                      {selectedGene && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span className="text-sm text-indigo-600 font-medium">Violin: {selectedGene}</span>
                        </>
                      )}
                    </div>
                    <ActionButtons onDownloadCSV={handleDownloadCSV} onDownloadExcel={handleDownloadExcel} onFullscreen={openFullscreen} />
                  </div>

                  <div className="space-y-6">
                    {/* Volcano Plot */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <VolcanoPlot
                        data={mappedResults}
                        title={`Volcano Plot: ${group2} vs ${group1}`}
                        logFcThreshold={minLogFC}
                        pValueThreshold={maxPval}
                      />
                    </div>

                    {/* Rank Genes Plot (top up/down) */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <RankGenesPlot
                        data={filteredResults}
                        topN={15}
                        pThreshold={maxPval}
                        title={`Top DEGs: ${group2} vs ${group1}`}
                      />
                    </div>

                    {/* Table — click row to open violin panel */}
                    <div className="bg-white rounded-lg shadow-sm border flex flex-col h-[500px]">
                      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                        <h4 className="font-semibold text-sm">Significant Genes ({filteredResults.length})</h4>
                        {selectedGene && (
                          <span className="text-xs text-indigo-600 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            Click a row to update the violin
                          </span>
                        )}
                        {!selectedGene && (
                          <span className="text-xs text-gray-400">Click a row to view violin plot →</span>
                        )}
                      </div>
                      <div className="flex-1 ag-theme-alpine w-full">
                        <AgGridReact
                          theme="legacy"
                          rowData={filteredResults}
                          columnDefs={columnDefs}
                          pagination={true}
                          paginationPageSize={50}
                          defaultColDef={{ sortable: true, filter: true, resizable: true }}
                          rowSelection="single"
                          onRowClicked={(e) => e.data?.gene && setSelectedGene(e.data.gene)}
                          rowStyle={{ cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* ── Bottom Panel: Enrichment / Decoupler (tabbed) ── */}
                    {isSuccess && (
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="border-b px-4">
                          <nav className="-mb-px flex space-x-6">
                            {([
                              { id: 'enrichment', label: '🔬 Functional Enrichment' },
                              { id: 'decoupler', label: '🔗 Decoupler (TF / Pathway / MSigDB)' },
                            ] as const).map(({ id, label }) => (
                              <button
                                key={id}
                                onClick={() => setBottomPanel(id)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                  bottomPanel === id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </nav>
                        </div>
                        <div>
                          {bottomPanel === 'enrichment' && (
                            <EnrichmentPanel
                              sessionId={activeSessionId}
                              deseqResults={filteredResults}
                              organism={organism}
                            />
                          )}
                          {bottomPanel === 'decoupler' && (
                            <DecouplerPanel
                              organism={organism}
                              deseqResults={filteredResults}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ───── Violin Slide-in Panel ───── */}
      <div
        className={`bg-white border-l flex flex-col transition-all duration-300 shrink-0 ${
          selectedGene ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        {selectedGene && (
          <>
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{selectedGene}</p>
                <p className="text-xs text-gray-400">Violin Plot</p>
              </div>
              <div className="flex items-center gap-1">
                {violinData?.image && (
                  <button
                    onClick={() => downloadImageAsPNG(violinData.image, `violin_${selectedGene}`)}
                    title="Download PNG"
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedGene(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
              {loadingViolin ? (
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              ) : violinData?.image ? (
                <img
                  src={violinData.image}
                  alt={`Violin ${selectedGene}`}
                  className="w-full h-auto rounded"
                />
              ) : (
                <p className="text-xs text-gray-400 text-center">No violin data</p>
              )}
            </div>

            {/* Quick groupby toggle inside violin panel */}
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 shrink-0">
              Grouped by: <span className="font-medium text-indigo-600">{groupByMode === 'clusters' ? 'CellType' : groupByColumn}</span>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={closeFullscreen} title="Differential Expression Results">
        <div className="ag-theme-alpine" style={{ height: '70vh', width: '100%' }}>
          {mappedResults && (
            <AgGridReact
              theme="legacy"
              rowData={mappedResults}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={100}
              defaultColDef={{ sortable: true, filter: true, resizable: true }}
            />
          )}
        </div>
      </FullscreenModal>
    </div>
  );
}
