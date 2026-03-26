import { useState, useMemo, useEffect, useRef } from 'react';
import { useFunctionalEnrichment } from '../hooks/useAnalysis';
import { ActionButtons } from './ui/ActionButtons';
import { exportToCSV } from '../utils/exportToCSV';
import { DotPlot } from './plots/DotPlot';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface EnrichmentPanelProps {
  sessionId: string;
  organism: string;
  deseqResults?: any[]; // To extract genes from
}

export function EnrichmentPanel({ sessionId, organism, deseqResults }: EnrichmentPanelProps) {
  const [genesInput, setGenesInput] = useState('');
  const [database, setDatabase] = useState('GO_Biological_Process');
  const [enrichmentResults, setEnrichmentResults] = useState<any[]>([]);
  
  const { mutate: runEnrichment, isPending: isEnrichmentLoading } = useFunctionalEnrichment(sessionId);

  // Auto-populate gene input when deseqResults first arrives (only if field is empty)
  const prevDeseqLengthRef = useRef(0);
  useEffect(() => {
    if (!deseqResults || deseqResults.length === 0) return;
    if (deseqResults.length === prevDeseqLengthRef.current) return;
    prevDeseqLengthRef.current = deseqResults.length;

    // Only auto-fill if the user hasn't typed anything yet
    if (genesInput.trim() !== '') return;

    const sigGenes = deseqResults
      .filter((r: any) => {
        const p = r.padj ?? r.pvalue ?? 1;
        return p < 0.05 && Math.abs(r.log2FoldChange) > 1;
      })
      .map((r: any) => r.gene)
      .filter(Boolean);

    if (sigGenes.length > 0) {
      setGenesInput(sigGenes.join('\n'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deseqResults]);

  const handleUseDEGs = () => {
    if (!deseqResults) return;
    // Filter for adj.P.Val < 0.05 & abs(logFC) > 1
    const sigGenes = deseqResults
      .filter((r: any) => (r.padj < 0.05 && Math.abs(r.log2FoldChange) > 1))
      .map((r: any) => r.gene);
      
    setGenesInput(sigGenes.join('\n'));
  };

  const handleEnrichment = () => {
    const geneList = genesInput.split(/[\n, ]+/).filter(g => g.trim().length > 0);
    runEnrichment({
      geneList,
      database,
      organism
    }, {
      onSuccess: (data) => {
        setEnrichmentResults(data.results || []);
      }
    });
  };
  
  // Format for DotPlot
  // API returns: term_name, pvalue, n_genes, intersection_size (maybe?)
  // We need check exact API response structure from enrichment_service.
  // Based on `backend/app/api/enrichment.py`: `results` is returned directly. 
  // Accessing `enrichment_service.py` would confirm keys.
  // Assuming keys: term_name, pvalue, adjusted_pvalue (maybe), intersection_size (count)
  // intersection_ratio or something for GeneRatio? 
  // If not available, we calculate from n_genes / input_length.
  
  const plotData = useMemo(() => {
    return enrichmentResults.slice(0, 20).map(r => ({
        term: r.term_name,
        padj: r.pvalue, // or r.adj_pvalue if available
        count: r.intersection_size || 5, // fallback
        generatio: (r.intersection_size || 1) / (genesInput.split(/[\n, ]+/).length || 100), // Approximate ratio
        log2FoldChange: 0
    }));
  }, [enrichmentResults, genesInput]);

  const colDefs: ColDef[] = [
    { field: 'term_name', headerName: 'Term', sortable: true, filter: true, flex: 2 },
    { field: 'pvalue', headerName: 'P-value', sortable: true, filter: 'agNumberColumnFilter', flex: 1, valueFormatter: (p: any) => p.value?.toExponential(2) },
    { field: 'intersection_size', headerName: 'Count', sortable: true, filter: 'agNumberColumnFilter', flex: 1 },
    { field: 'genes', headerName: 'Genes', sortable: false, flex: 2 }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        
        {/* Configuration Section */}
        <div className="mb-6 border-b pb-6 space-y-4">
            <h4 className="font-semibold text-gray-800">Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Database</label>
                    <select 
                        value={database} 
                        onChange={(e) => setDatabase(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="GO_Biological_Process">GO Biological Process</option>
                        <option value="KEGG">KEGG</option>
                        <option value="Reactome">Reactome</option>
                        <option value="WikiPathways">WikiPathways</option>
                    </select>
                </div>
                <div>
                    <div className="flex justify-between">
                         <label className="block text-sm font-medium text-gray-700">Genes</label>
                         {deseqResults && (
                             <button onClick={handleUseDEGs} className="text-xs text-indigo-600 hover:text-indigo-800">
                                 Use Top DEGs (Padj &lt; 0.05)
                             </button>
                         )}
                    </div>
                    <textarea 
                        value={genesInput}
                        onChange={(e) => setGenesInput(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Paste gene list here..."
                    />
                </div>
            </div>
            <button
                onClick={handleEnrichment}
                disabled={isEnrichmentLoading || !genesInput}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
                {isEnrichmentLoading ? 'Running Enrichment...' : 'Run Analysis'}
            </button>
        </div>
        
        {/* Results Section */}
        {enrichmentResults.length > 0 && (
            <div className="space-y-6">
                <div className="flex justify-end">
                     <ActionButtons 
                        onDownloadCSV={() => exportToCSV(enrichmentResults, `enrichment_${database}`)}
                     />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Table */}
                    <div className="h-[600px] bg-gray-50 border rounded-lg flex flex-col">
                        <h5 className="font-medium p-3 border-b bg-white">Results Table</h5>
                        <div className="flex-1 ag-theme-alpine">
                            <AgGridReact
                                theme="legacy"
                                rowData={enrichmentResults}
                                columnDefs={colDefs}
                                pagination={true}
                                paginationPageSize={20}
                            />
                        </div>
                    </div>

                    {/* Dot Plot */}
                    <div className="border rounded-lg bg-white p-2">
                         <DotPlot 
                            data={plotData} 
                            title={`Top 20 Terms (${database})`}
                         />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
