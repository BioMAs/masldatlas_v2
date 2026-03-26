import { useState } from 'react';
import { usePseudobulk } from '../hooks/useAnalysis';
import { useDatasetInfo } from '../hooks/useDataset';
import { DecouplerPanel } from './DecouplerPanel';
import { EnrichmentPanel } from './EnrichmentPanel';
import { VolcanoPlot } from './plots/VolcanoPlot';
import { exportToCSV } from '../utils/exportToCSV';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { Settings, BarChart2, Layers, Database } from 'lucide-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface PseudobulkAnalysisProps {
  sessionId: string;
}

type MainTab = 'deg' | 'enrichment';
type EnrichmentTab = 'functional' | 'regulatory';

export function PseudobulkAnalysis({ sessionId }: PseudobulkAnalysisProps) {
  const { data: info } = useDatasetInfo(sessionId);
  const { mutate: runPseudobulk, isPending, data: results } = usePseudobulk(sessionId);

  // Configuration State
  const [sampleCol, setSampleCol] = useState('Sample');
  const [conditionCol, setConditionCol] = useState('Condition');
  const [refLevel, setRefLevel] = useState('');
  const [targetLevel, setTargetLevel] = useState('');
  const [cellType, setCellType] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // View State
  const [activeTab, setActiveTab] = useState<MainTab>('deg');
  const [enrichmentTab, setEnrichmentTab] = useState<EnrichmentTab>('functional');

  // Extract organism from sessionId for Decoupler/Enrichment
  const organism = sessionId.split('_')[0].toLowerCase();
  const deseqResults = results?.results || [];

  const handleRun = () => {
    runPseudobulk({
      sampleCol,
      conditionCol,
      refLevel,
      targetLevel,
      cellType: cellType || undefined
    });
  };

  const degColDefs: ColDef[] = [
    { field: 'gene', headerName: 'Gene', sortable: true, filter: true },
    { field: 'log2FoldChange', headerName: 'Log2 FC', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (p: any) => p.value?.toFixed(3) },
    { field: 'pvalue', headerName: 'P-value', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (p: any) => p.value?.toExponential(2) },
    { field: 'padj', headerName: 'Adj. P-value', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: (p: any) => p.value?.toExponential(2) }
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-50 text-gray-900 rounded-lg overflow-hidden border">
      
      {/* Sidebar / Configuration */}
      <div className={`${isConfigOpen ? 'w-80' : 'w-12'} bg-white border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            {isConfigOpen && <h3 className="font-bold text-gray-700">Configuration</h3>}
            <button 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="text-gray-500 hover:text-gray-700"
            >
                <Settings className="w-5 h-5" />
            </button>
        </div>
        
        {isConfigOpen && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sample Column</label>
                    <select 
                        value={sampleCol} 
                        onChange={(e) => setSampleCol(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        {info?.metadata_columns?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Condition Column</label>
                    <select 
                        value={conditionCol} 
                        onChange={(e) => setConditionCol(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        {info?.metadata_columns?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ref Level (Control)</label>
                    <input 
                        type="text" 
                        value={refLevel} 
                        onChange={(e) => setRefLevel(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g. Healthy"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Target Level (Case)</label>
                    <input 
                        type="text" 
                        value={targetLevel} 
                        onChange={(e) => setTargetLevel(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g. Disease"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cell Type (Optional)</label>
                    <select 
                        value={cellType} 
                        onChange={(e) => setCellType(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">All Cells</option>
                        {info?.cell_types?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleRun}
                        disabled={isPending || !refLevel || !targetLevel}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-colors"
                    >
                        {isPending ? 'Running DESeq2...' : 'Run Analysis'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 italic text-center">
                        Analysis runs on the full dataset (high precision).
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            
            {/* Top Navigation Tabs */}
            <div className="bg-white border-b px-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('deg')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'deg' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Differential Expression (DEG)
                    </button>
                    <button
                        onClick={() => setActiveTab('enrichment')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'enrichment' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Layers className="w-4 h-4" />
                        Enrichment & Pathways
                    </button>
                </nav>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-auto p-6">
                
                {/* DEG TAB */}
                {activeTab === 'deg' && (
                    <div className="space-y-6">
                        {!results ? (
                            <div className="text-center py-20 text-gray-500">
                                Configure parameters on the left and click "Run Analysis" to start.
                            </div>
                        ) : (
                            <>
                                {/* PCA Plot — Pseudo-bulk samples */}
                                {results?.pca_image && (
                                    <div className="bg-white rounded-lg shadow-sm border p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Database className="w-4 h-4 text-indigo-500" />
                                            <h4 className="font-semibold text-sm text-gray-800">PCA — Pseudo-bulk Samples</h4>
                                            <span className="ml-auto text-xs text-gray-400">{results.sample_count} samples · {results.contrast}</span>
                                        </div>
                                        <img
                                            src={results.pca_image}
                                            alt="PCA pseudo-bulk"
                                            className="w-full h-auto max-h-[420px] object-contain rounded"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                     {/* Volcano Plot */}
                                     <VolcanoPlot 
                                        data={deseqResults} 
                                        title={`Volcano Plot: ${targetLevel} vs ${refLevel}`}
                                     />
                                     
                                     {/* Stats Summary Panel could go here if needed */}
                                     <div className="bg-white p-6 rounded-lg shadow-sm">
                                         <h4 className="font-bold text-gray-700 mb-4">Analysis Summary</h4>
                                         <ul className="space-y-2 text-sm text-gray-600">
                                             <li><strong>Design:</strong> ~ {conditionCol}</li>
                                             <li><strong>Contrast:</strong> {targetLevel} vs {refLevel}</li>
                                             <li><strong>Total Genes:</strong> {deseqResults.length}</li>
                                             <li><strong>Significant (Padj &lt; 0.05):</strong> {deseqResults.filter((r: any) => r.padj < 0.05).length}</li>
                                         </ul>
                                         
                                         <div className="mt-6 flex gap-2">
                                             <button 
                                                onClick={() => exportToCSV(deseqResults, `deg_results`)}
                                                className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm font-medium"
                                             >
                                                Export Results CSV
                                             </button>
                                         </div>
                                     </div>
                                </div>

                                {/* Table */}
                                <div className="h-[500px] border rounded-lg shadow-sm bg-white flex flex-col">
                                    <h4 className="font-semibold p-4 border-b">Differential Expression Results</h4>
                                    <div className="flex-1 ag-theme-alpine">
                                        <AgGridReact
                                            theme="legacy"
                                            rowData={deseqResults}
                                            columnDefs={degColDefs}
                                            pagination={true}
                                            paginationPageSize={20}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ENRICHMENT TAB */}
                {activeTab === 'enrichment' && (
                    <div className="space-y-6">
                        {/* Sub-tabs for Enrichment */}
                         <div className="flex gap-2 border-b border-gray-200 pb-2 mb-4">
                            <button
                                onClick={() => setEnrichmentTab('functional')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    enrichmentTab === 'functional'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Functional (GO/KEGG)
                            </button>
                            <button
                                onClick={() => setEnrichmentTab('regulatory')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    enrichmentTab === 'regulatory'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Regulatory (TF/Pathway)
                            </button>
                         </div>

                         {enrichmentTab === 'functional' && (
                             <EnrichmentPanel 
                                sessionId={sessionId} 
                                organism={organism} 
                                deseqResults={deseqResults}
                             />
                         )}

                         {enrichmentTab === 'regulatory' && (
                             <DecouplerPanel 
                                deseqResults={deseqResults}
                                organism={organism}
                             />
                         )}
                    </div>
                )}
            </div>
      </div>
    </div>
  );
}
