
import { useState, useEffect } from 'react';
import { useDatasetInfo, useUMAPVisualization, useViolinVisualization, useDatasetGenes, useSubsetStats } from '../hooks/useDataset';
import { useMarkerGenes } from '../hooks/useAnalysis';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Download, Maximize2, RefreshCw, Activity, Sparkles, GitMerge } from 'lucide-react';
import { exportToCSV } from '../utils/exportToCSV';
import { FullscreenModal } from './ui/FullscreenModal';
import { GeneSelector } from './ui/GeneSelector';
import { GeneSetEnrichment } from './GeneSetEnrichment';
import { GeneCorrelation } from './GeneCorrelation';

type TopMode = 'gene_expression' | 'geneset' | 'coexpression';

interface ClusterSelectionProps {
  sessionId: string;
}

export function ClusterSelection({ sessionId }: ClusterSelectionProps) {
  const [topMode, setTopMode] = useState<TopMode>('gene_expression');
  const [activeSubTab, setActiveSubTab] = useState<'markers' | 'zoom'>('markers');
  const { data: datasetGenes } = useDatasetGenes(sessionId);

  const topTabs: { value: TopMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'gene_expression',
      label: 'Visualize Gene Expression',
      icon: <Activity className="w-4 h-4" />,
      description: 'UMAP, violin plots & marker genes for a single gene',
    },
    {
      value: 'geneset',
      label: 'Visualize Geneset Expression',
      icon: <Sparkles className="w-4 h-4" />,
      description: 'Module scoring for custom gene signatures',
    },
    {
      value: 'coexpression',
      label: 'Calculate Co-Expression',
      icon: <GitMerge className="w-4 h-4" />,
      description: 'Spearman / Pearson correlation between two genes',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top-level mode selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {topTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTopMode(tab.value)}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              topMode === tab.value
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <span className={`mt-0.5 ${topMode === tab.value ? 'text-blue-600' : 'text-gray-400'}`}>
              {tab.icon}
            </span>
            <div>
              <p className={`text-sm font-semibold ${topMode === tab.value ? 'text-blue-700' : 'text-gray-700'}`}>
                {tab.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Mode : Gene Expression */}
      {topMode === 'gene_expression' && (
        <div className="space-y-4">
          <div className="flex space-x-4 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveSubTab('markers')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                activeSubTab === 'markers'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Marker Genes (One-vs-Rest)
            </button>
            <button
              onClick={() => setActiveSubTab('zoom')}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                activeSubTab === 'zoom'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cluster Analysis
            </button>
          </div>
          {activeSubTab === 'markers' ? (
            <MarkersTab sessionId={sessionId} />
          ) : (
            <ZoomTab sessionId={sessionId} />
          )}
        </div>
      )}

      {/* Mode : Geneset Expression */}
      {topMode === 'geneset' && (
        <GeneSetEnrichment sessionId={sessionId} />
      )}

      {/* Mode : Co-Expression */}
      {topMode === 'coexpression' && (
        <GeneCorrelation sessionId={sessionId} availableGenes={datasetGenes || []} />
      )}
    </div>
  );
}

function MarkersTab({ sessionId }: { sessionId: string }) {
  const { data: datasetInfo } = useDatasetInfo(sessionId);
  const { mutate: computeMarkers, data: markers, isPending } = useMarkerGenes(sessionId);
  const [groupby, setGroupby] = useState('CellType');
  const [, setGridApi] = useState<GridApi | null>(null);

  // Default run on mount if not loaded
  useEffect(() => {
    if (sessionId && !markers) {
      computeMarkers({ groupby, n_genes: 100 });
    }
  }, [sessionId]);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  const handleExport = () => {
    if (markers) {
      exportToCSV(markers, `markers_${sessionId}_${groupby}`);
    }
  };

  const columnDefs: ColDef[] = [
    { field: 'cluster', headerName: 'Cluster/Group', sortable: true, filter: true, pinned: 'left' },
    { field: 'gene', headerName: 'Gene', sortable: true, filter: true },
    { field: 'logfoldchanges', headerName: 'Log2FC', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: p => p.value?.toFixed(3) },
    { field: 'pvals_adj', headerName: 'Adj P-Value', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: p => p.value?.toExponential(2) },
    { field: 'scores', headerName: 'Score', sortable: true, filter: 'agNumberColumnFilter', valueFormatter: p => p.value?.toFixed(2) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
             <select 
               value={groupby} 
               onChange={(e) => setGroupby(e.target.value)}
               className="p-2 border rounded-md text-sm"
             >
                <option value="CellType">CellType</option>
                {datasetInfo?.metadata_columns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
             </select>
          </div>
          <button
             onClick={() => computeMarkers({ groupby, n_genes: 100 })}
             disabled={isPending}
             className="px-4 py-2 mt-5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
             {isPending && <RefreshCw className="animate-spin w-4 h-4" />}
             Find Markers
          </button>
        </div>
        <div>
           <button onClick={handleExport} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>
      </div>

      <div className="ag-theme-alpine w-full h-[600px] rounded-lg shadow-sm border overflow-hidden">
        {isPending ? (
          <div className="flex h-full items-center justify-center bg-gray-50">
             <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p>Computing markers (this may take a moment)...</p>
             </div>
          </div>
        ) : (
          <AgGridReact
            theme="legacy"
            rowData={markers}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            pagination={true}
            paginationPageSize={20}
            animateRows={true}
          />
        )}
      </div>
    </div>
  );
}

function ZoomTab({ sessionId }: { sessionId: string }) {
  const { data: datasetInfo } = useDatasetInfo(sessionId);
  const { data: datasetGenes } = useDatasetGenes(sessionId);
  
  // Selection State
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedGene, setSelectedGene] = useState<string>('');
  const [compareGroup, setCompareGroup] = useState<string>(''); // For bottom-left violin ("Condition")

  // Initialize defaults
  useEffect(() => {
    if (datasetInfo) {
       if (!selectedCluster && datasetInfo.cell_types.length > 0) {
           setSelectedCluster(datasetInfo.cell_types[0]);
       }
       if (!compareGroup) {
           // Heuristic: try to find 'condition', 'disease', 'status', 'group' column
           // And filter out obviously numeric/qc columns
           const validColumns = datasetInfo.metadata_columns.filter(c => 
               !['n_genes', 'n_counts', 'pct_', 'log1p_', 'total_', '_score', 'top_genes'].some(bad => c.toLowerCase().includes(bad))
           );

           const potential = validColumns.find(c => 
               ['condition', 'group', 'disease', 'status', 'diagnosis', 'sex'].some(k => c.toLowerCase().includes(k))
           );
           setCompareGroup(potential || validColumns.find(c => c !== 'CellType') || 'CellType');
       }
    }
  }, [datasetInfo]);

  // Data Fetching
  const { data: subsetStats } = useSubsetStats(sessionId, 'CellType', selectedCluster);
  
  // 1. UMAP Subset Colored by Gene
  const { data: umapGene, isFetching: loadingUmapGene } = useUMAPVisualization(
    sessionId,
    selectedGene || 'CellType', // Fallback color
    'CellType',
    selectedCluster ? [selectedCluster] : []
  );

  // 2. UMAP Subset Colored by Cluster (Identity)
  const { data: umapCluster, isFetching: loadingUmapCluster } = useUMAPVisualization(
    sessionId,
    'CellType',
    'CellType',
    selectedCluster ? [selectedCluster] : []
  );

  // 3. Violin Subset Grouped by CompareGroup (e.g. Condition)
  const { data: violinCompare, isFetching: loadingViolinCompare } = useViolinVisualization(
    sessionId,
    selectedGene ? [selectedGene] : [],
    compareGroup,
    'CellType',
    selectedCluster ? [selectedCluster] : []
  );

  // 4. Violin Subset Grouped by Cluster (Identity)
  const { data: violinCluster, isFetching: loadingViolinCluster } = useViolinVisualization(
    sessionId,
    selectedGene ? [selectedGene] : [],
    'CellType',
    'CellType',
    selectedCluster ? [selectedCluster] : []
  );

  // Modal logic
  const [isFullscreen, setFullscreen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const openModal = (img: string) => { setActiveImage(img); setFullscreen(true); }

  // Safe Stats
  const nCells = subsetStats?.n_cells ?? '...';
  // Use global gene count if subset not available, usually genes are constant unless filtered
  const nGenes = datasetInfo?.n_genes ?? '...'; 

  // Compute percentage if available
  const totalCells = datasetInfo?.n_cells;
  const percentage = (typeof nCells === 'number' && typeof totalCells === 'number') 
    ? ((nCells / totalCells) * 100).toFixed(1) 
    : null;

  return (
    <div className="space-y-6">
       {/* 1. Header & Controls */}
       <div className="bg-white p-4 rounded-lg shadow-md border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Cluster Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Cluster</label>
            <select 
               className="w-full p-2 border rounded-md bg-white text-sm"
               value={selectedCluster}
               onChange={(e) => setSelectedCluster(e.target.value)}
            >
               {datasetInfo?.cell_types.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
               ))}
            </select>
          </div>

          {/* Gene Selection */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Select Gene</label>
             <div className="w-full">
                <GeneSelector 
                  allGenes={datasetGenes || []}
                  selectedGenes={selectedGene ? [selectedGene] : []}
                  onChange={(genes) => setSelectedGene(genes[0] || '')}
                  placeholder="Type gene (e.g. CD3)..."
                  singleSelect={true}
                />
             </div>
          </div>

          {/* Comparison Group Selection */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Compare By</label>
             <select 
               className="w-full p-2 border rounded-md bg-white text-sm"
               value={compareGroup}
               onChange={(e) => setCompareGroup(e.target.value)}
             >
                {datasetInfo?.metadata_columns
                    .filter(c => c !== 'CellType' && !['n_genes', 'n_counts', 'pct_', 'log1p_', 'total_', '_score'].some(bad => c.toLowerCase().includes(bad)))
                    .map(c => (
                   <option key={c} value={c}>{c}</option>
                ))}
             </select>
          </div>
          
          {/* Stats Display */}
          <div className="h-full flex items-center justify-center md:justify-end pb-1">
             <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border flex flex-col items-end min-w-[150px]">
                <div className="flex justify-between w-full">
                   <span className="font-semibold text-gray-800">Cells:</span> 
                   <span>{nCells} {percentage && `(${percentage}%)`}</span>
                </div>
                <div className="flex justify-between w-full mt-1">
                   <span className="font-semibold text-gray-800">Genes:</span> 
                   <span>{nGenes}</span>
                </div>
             </div>
          </div>
       </div>

       {/* 2. Visualization Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* UMAP colored by Gene */}
          <PlotCard 
             title={`Expression of ${selectedGene || '...'}`} 
             subtitle="in selected cluster"
             isLoading={loadingUmapGene} 
             image={umapGene?.image} 
             onZoom={() => umapGene?.image && openModal(umapGene.image)}
             emptyText={!selectedGene ? "Select a gene to view expression" : "No image generated"}
          />

          {/* UMAP colored by Identity */}
          <PlotCard 
             title="Cluster Identity" 
             subtitle="in selected cluster"
             isLoading={loadingUmapCluster} 
             image={umapCluster?.image} 
             onZoom={() => umapCluster?.image && openModal(umapCluster.image)}
          />

          {/* Violin Split by Condition */}
          <PlotCard 
             title={`Expression of ${selectedGene || '...'} by ${compareGroup}`} 
             subtitle="Comparison within cluster"
             isLoading={loadingViolinCompare} 
             image={violinCompare?.image} 
             onZoom={() => violinCompare?.image && openModal(violinCompare.image)}
             emptyText={!selectedGene ? "Select a gene" : "No image generated"}
          />

          {/* Violin by Cluster (Single) */}
          <PlotCard 
             title={`Expression of ${selectedGene || '...'}`} 
             subtitle="Overall expression in cluster"
             isLoading={loadingViolinCluster} 
             image={violinCluster?.image} 
             onZoom={() => violinCluster?.image && openModal(violinCluster.image)}
             emptyText={!selectedGene ? "Select a gene" : "No image generated"}
          />
       </div>

       <FullscreenModal isOpen={isFullscreen} onClose={() => setFullscreen(false)} title="Zoom View">
         {activeImage && <img src={activeImage} className="max-w-full max-h-screen mx-auto" alt="Zoomed view" />}
      </FullscreenModal>
    </div>
  );
}

function PlotCard({ title, subtitle, isLoading, image, onZoom, emptyText }: any) {
   return (
      <div className="bg-white rounded-lg shadow-md p-4 min-h-[350px] flex flex-col">
         <div className="flex justify-between items-start mb-2">
            <div>
               <h3 className="font-semibold text-gray-800">{title}</h3>
               {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
            {image && (
                <button onClick={onZoom} className="text-gray-400 hover:text-blue-600 transition-colors">
                   <Maximize2 className="w-5 h-5" />
                </button>
            )}
         </div>
         
         <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100 overflow-hidden">
            {isLoading ? (
               <RefreshCw className="animate-spin text-blue-500 w-8 h-8" />
            ) : image ? (
               <img src={image} alt={title} className="w-full h-full object-contain max-h-[400px]" />
            ) : (
               <span className="text-gray-400 text-sm">{emptyText || "No data available"}</span>
            )}
         </div>
      </div>
   );
}
