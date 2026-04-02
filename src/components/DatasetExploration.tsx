import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UMAPVisualization } from './UMAPVisualization';
import { useDatasetInfo } from '../hooks/useDataset';
import { useMarkerGenes } from '../hooks/useAnalysis';
import { useFullscreen } from '../hooks/useFullscreen';
import { ActionButtons } from './ui/ActionButtons';
import { FullscreenModal } from './ui/FullscreenModal';
import { RankingScatterPlot } from './plots/RankingScatterPlot';
import { DotPlotVisualization } from './DotPlotVisualization';
import { exportToCSV } from '../utils/exportToCSV';
import { exportToExcel } from '../utils/exportToExcel';
import { apiClient } from '../lib/api';
import { downloadImageAsPNG } from '../utils/downloadImage';
import type { TestMethod } from '../types/api';

interface DatasetExplorationProps {
  sessionId: string;
}

export function DatasetExploration({ sessionId }: DatasetExplorationProps) {
  const { data: datasetInfo } = useDatasetInfo(sessionId);
  const [metadataColumn, setMetadataColumn] = useState<string>('Sample'); 
  const { mutate: computeMarkers, data: markers, isPending: isLoadingMarkers } = useMarkerGenes(sessionId);
  const [markerGroupby, setMarkerGroupby] = useState<string>('CellType');
  const [markerMethod, setMarkerMethod] = useState<TestMethod>('wilcoxon');
  const [markerNGenes, setMarkerNGenes] = useState<number>(100);
  const { isFullscreen, openFullscreen, closeFullscreen } = useFullscreen();
  const { isFullscreen: isPlotFullscreen, openFullscreen: openPlotFullscreen, closeFullscreen: closePlotFullscreen } = useFullscreen();

  // Load markers when component mounts or session changes
  useEffect(() => {
    if (sessionId) {
      computeMarkers({ groupby: markerGroupby, method: markerMethod, n_genes: markerNGenes });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, markerGroupby, computeMarkers]);

  const [selectedCluster, setSelectedCluster] = useState<string>('All');

  // CellType Groups Overview (all-groups rank-genes-dotplot — legacy imageoutput_CellType_groups)
  const { data: celltypeGroupsData, isFetching: loadingCelltypeGroups } = useQuery({
    queryKey: ['rank-genes-dotplot', sessionId, markerGroupby],
    queryFn: () =>
      apiClient
        .get(`/visualization/rank-genes-dotplot/${sessionId}`, { params: { n_genes: 5 } })
        .then((r) => r.data),
    enabled: !!sessionId,
  });

  // DotPlot: derived list of top genes from markers (auto-populated)
  const [dotplotGenes, setDotplotGenes] = useState<string[]>([]);
  const [dotplotInput, setDotplotInput] = useState<string>('');
  const [dotplotGroupby, setDotplotGroupby] = useState<string>('CellType');
  const [showDotplot, setShowDotplot] = useState(false);

  useEffect(() => {
    if (markers && markers.length > 0 && dotplotGenes.length === 0) {
      const top = Array.from(
        new Map(markers.map((m) => [m.cluster, m])).values()
      ).slice(0, 8).map((m) => m.gene);
      setDotplotGenes(top);
      setDotplotInput(top.join(', '));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // Fetch rank_genes_groups backend image when a specific cluster is selected
  const { data: rankGenesImageData, isFetching: loadingRankGenesImage } = useQuery({
    queryKey: ['rank-genes-groups', sessionId, selectedCluster, markerGroupby],
    queryFn: () =>
      apiClient
        .get(`/visualization/rank-genes-groups/${sessionId}`, {
          params: { group: selectedCluster, groupby: markerGroupby, n_genes: 20 },
        })
        .then((r) => r.data),
    enabled: selectedCluster !== 'All' && !!sessionId,
  });
  
  const uniqueClusters = markers 
    ? Array.from(new Set(markers.map(m => m.cluster))).sort() 
    : [];

  const filteredMarkers = selectedCluster === 'All' 
    ? markers 
    : markers?.filter(m => m.cluster === selectedCluster);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCluster, markerGroupby]);

  const totalItems = filteredMarkers?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedMarkers = filteredMarkers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadCSV = () => {
    if (filteredMarkers && filteredMarkers.length > 0) {
      exportToCSV(filteredMarkers, `marker_genes_${markerGroupby}`);
    }
  };

  const handleDownloadExcel = () => {
    if (filteredMarkers && filteredMarkers.length > 0) {
      exportToExcel(filteredMarkers, `marker_genes_${markerGroupby}`, 'Marker Genes');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Row: UMAPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fixed UMAP: CellType */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Global Structure (CellType)
          </h3>
          <UMAPVisualization sessionId={sessionId} colorBy="CellType" />
        </div>

        {/* Dynamic UMAP: Metadata */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Metadata Visualization
            </h3>
            <select
              value={metadataColumn}
              onChange={(e) => setMetadataColumn(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {datasetInfo?.metadata_columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <UMAPVisualization sessionId={sessionId} colorBy={metadataColumn} />
        </div>
      </div>

      {/* Bottom Row: Marker Genes */}
      <div className="bg-white rounded-lg shadow-md p-6 relative">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Marker Genes</h3>
            <p className="text-sm text-gray-500">
              Top discriminative genes identifying each cluster (One-vs-Rest)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter Cluster:</label>
                <select
                  value={selectedCluster}
                  onChange={(e) => setSelectedCluster(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="All">All Clusters</option>
                  {uniqueClusters.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
             </div>
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Group By:</label>
                <select 
                    value={markerGroupby}
                    onChange={(e) => setMarkerGroupby(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                    <option value="CellType">CellType</option>
                    {datasetInfo?.metadata_columns.filter(c => c !== 'CellType').map(c => (
                         <option key={c} value={c}>{c}</option>
                    ))}
                </select>
             </div>
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Method:</label>
                <select
                  value={markerMethod}
                  onChange={(e) => setMarkerMethod(e.target.value as TestMethod)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="wilcoxon">Wilcoxon</option>
                  <option value="t-test">t-test</option>
                  <option value="logreg">LogReg</option>
                </select>
             </div>
             <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">N Genes:</label>
                <input
                  type="number"
                  value={markerNGenes}
                  onChange={(e) => setMarkerNGenes(Math.max(10, Math.min(500, Number(e.target.value))))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  min={10}
                  max={500}
                  step={10}
                />
             </div>
             <button
              onClick={() => computeMarkers({ groupby: markerGroupby, method: markerMethod, n_genes: markerNGenes })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={isLoadingMarkers}
            >
              {isLoadingMarkers ? 'Computing...' : 'Refresh Markers'}
            </button>
             <ActionButtons
                onDownloadCSV={handleDownloadCSV}
                onDownloadExcel={handleDownloadExcel}
                onFullscreen={openFullscreen}
                position="inline"
             />
          </div>
        </div>

        {/* Grid layout: Scatter Plot + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Ranking Scatter Plot */}
          <div className="bg-gray-50 rounded-lg p-4 relative">
            {selectedCluster !== 'All' && filteredMarkers && filteredMarkers.length > 0 ? (
              <>
                <ActionButtons
                  onFullscreen={openPlotFullscreen}
                  position="top-right"
                  className="bg-white/90 shadow-sm"
                />
                <RankingScatterPlot
                    data={filteredMarkers.map(m => ({
                    gene: m.gene,
                    score: m.score || 0,
                    log2FoldChange: m.avg_log2FC || 0,
                    pvalue: m.p_val_adj || 1,
                    padj: m.p_val_adj
                    }))}
                    title={`Gene Ranking: ${selectedCluster}`}
                    topLabels={10}
                />
              </>
            ) : (
              /* CellType Groups Overview (all groups — legacy imageoutput_CellType_groups) */
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 self-start">
                  CellType Groups Overview
                  <span className="ml-2 text-xs font-normal text-gray-400">(groupby: {markerGroupby})</span>
                </h4>
                {loadingCelltypeGroups ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                  </div>
                ) : celltypeGroupsData?.image ? (
                  <>
                    <img
                      src={celltypeGroupsData.image}
                      alt="CellType Groups Overview"
                      className="w-full h-auto rounded"
                    />
                    <ActionButtons
                      onDownloadImage={() =>
                        downloadImageAsPNG(celltypeGroupsData.image, `celltype_groups_${markerGroupby}`)
                      }
                      position="inline"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-60 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300 w-full">
                    <div className="text-center">
                      <p className="text-lg font-medium">Select a cluster</p>
                      <p className="text-sm mt-2">Choose a specific cluster to view gene ranking</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
          {isLoadingMarkers ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : paginatedMarkers && paginatedMarkers.length > 0 ? (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {markerGroupby}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gene
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Log2FC
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adj P-Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMarkers.map((marker, idx) => (
                    <tr key={`${marker.cluster}-${marker.gene}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {marker.cluster}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                        {marker.gene}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {marker.score?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {marker.avg_log2FC?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {marker.p_val_adj?.toExponential(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                <div className="hidden sm:flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                    
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No marker genes found.
            </div>
          )}
          </div>
        </div>
        {/* Rank Genes Groups Image */}
        {selectedCluster !== 'All' && (
          <div className="mt-2 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Rank Genes Groups —{' '}
                <span className="text-blue-600">{selectedCluster}</span>
                <span className="ml-2 text-xs font-normal text-gray-400">(groupby: {markerGroupby})</span>
              </h4>
              {rankGenesImageData?.image && (
                <ActionButtons
                  onDownloadImage={() =>
                    downloadImageAsPNG(
                      rankGenesImageData.image,
                      `rank_genes_groups_${selectedCluster}`
                    )
                  }
                  position="inline"
                />
              )}
            </div>
            {loadingRankGenesImage ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            ) : rankGenesImageData?.image ? (
              <img
                src={rankGenesImageData.image}
                alt={`Rank Genes Groups: ${selectedCluster}`}
                className="w-full h-auto rounded"
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No image available</p>
            )}
          </div>
        )}

      </div>

      {/* ── Dot Plot Explorer ── */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Dot Plot Explorer</h3>
            <p className="text-sm text-gray-500">Visualize gene expression across cell types</p>
          </div>
          <button
            onClick={() => setShowDotplot((v) => !v)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
          >
            {showDotplot ? 'Hide Dot Plot' : 'Show Dot Plot'}
          </button>
        </div>

        {showDotplot && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genes (comma-separated)</label>
                <textarea
                  value={dotplotInput}
                  onChange={(e) => setDotplotInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ACTA2, COL1A1, EPCAM"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                  <select
                    value={dotplotGroupby}
                    onChange={(e) => setDotplotGroupby(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="CellType">CellType</option>
                    {datasetInfo?.metadata_columns.filter((c) => c !== 'CellType').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const genes = dotplotInput.split(/[,\n]+/).map((g) => g.trim()).filter(Boolean);
                    setDotplotGenes(genes);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm"
                >
                  Generate Dot Plot
                </button>
              </div>
            </div>
            {dotplotGenes.length > 0 && (
              <DotPlotVisualization
                sessionId={sessionId}
                genes={dotplotGenes}
                groupby={dotplotGroupby}
              />
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal for Marker Genes */}
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={closeFullscreen}
        title="Marker Genes"
      >
        <div className="overflow-x-auto">
          {filteredMarkers && filteredMarkers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {markerGroupby}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gene
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Log2FC
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adj P-Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMarkers.map((marker, idx) => (
                  <tr key={`${marker.cluster}-${marker.gene}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {marker.cluster}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      {marker.gene}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {marker.score?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {marker.avg_log2FC?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {marker.p_val_adj?.toExponential(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No marker genes found.
            </div>
          )}
        </div>
      </FullscreenModal>

      {/* Fullscreen Modal for Ranking Plot */}
      <FullscreenModal
        isOpen={isPlotFullscreen}
        onClose={closePlotFullscreen}
        title={`Gene Ranking: ${selectedCluster}`}
      >
         <div className="h-[80vh] w-full p-4">
            {selectedCluster !== 'All' && filteredMarkers ? (
                <RankingScatterPlot
                    data={filteredMarkers.map(m => ({
                    gene: m.gene,
                    score: m.score || 0,
                    log2FoldChange: m.avg_log2FC || 0,
                    pvalue: m.p_val_adj || 1,
                    padj: m.p_val_adj
                    }))}
                    title={`Gene Ranking: ${selectedCluster}`}
                    topLabels={20} // Show more labels in fullscreen
                />
            ) : null}
         </div>
      </FullscreenModal>
    </div>
  );
}

