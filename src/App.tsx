/**
 * Main App component
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DatasetSelector } from './components/DatasetSelector';
import { DatasetExploration } from './components/DatasetExploration';
import { DifferentialExpression } from './components/DifferentialExpression';
import { PseudobulkAnalysis } from './components/PseudobulkAnalysis';
import { ClusterSelection } from './components/ClusterSelection';
import { ClusterFilter } from './components/ClusterFilter';
import { Documentation } from './components/Documentation';
import { GeneSetEnrichment } from './components/GeneSetEnrichment';
import { useDatasetInfo } from './hooks/useDataset';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type AnalysisTab = 'exploration' | 'dge' | 'pseudobulk' | 'cluster_selection' | 'geneset' | 'documentation';

function AppContent() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filteredSessionId, setFilteredSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('exploration');
  const [selectedGene, setSelectedGene] = useState('');
  const [isMainSidenavOpen, setIsMainSidenavOpen] = useState(true);

  const { data: datasetInfo, isLoading: isLoadingInfo } = useDatasetInfo(sessionId);

  const tabs = [
    { id: 'exploration', label: 'Exploration' },
    { id: 'cluster_selection', label: 'Cluster Selection' },
    { id: 'dge', label: 'Differential Expression' },
    { id: 'pseudobulk', label: 'Pseudo-bulk' },
    { id: 'geneset', label: 'Gene Set Enrichment' },
    { id: 'documentation', label: 'Documentation' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                MASLDatlas <span className="text-blue-600">v2.0</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Multi-species scRNA-seq Atlas - Modern Stack
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                FastAPI + React
              </span>
              {sessionId && datasetInfo && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {datasetInfo.n_cells.toLocaleString()} cells
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Dataset Selection */}
          <div className={`${isMainSidenavOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
            <div className="space-y-6">
            {isMainSidenavOpen && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Configuration</h3>
                  <button
                    onClick={() => setIsMainSidenavOpen(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            <DatasetSelector onDatasetLoaded={(id) => { setSessionId(id); setFilteredSessionId(null); }} />

            {/* Cluster Filter */}
            {sessionId && datasetInfo && (
              <ClusterFilter
                sessionId={sessionId}
                cellTypes={datasetInfo.cell_types || []}
                onFilterApplied={(info) => setFilteredSessionId(info.session_id)}
              />
            )}

            {/* Gene Search */}
            {sessionId && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Gene Search
                </h3>
                <input
                  type="text"
                  value={selectedGene}
                  onChange={(e) => setSelectedGene(e.target.value)}
                  placeholder="Enter gene name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {selectedGene && (
                  <p className="text-xs text-gray-500 mt-2">
                    Viewing: <strong>{selectedGene}</strong>
                  </p>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Main Area - Analysis Tabs */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {/* Toggle Button */}
              {!isMainSidenavOpen && sessionId && activeTab !== 'documentation' && (
                <button
                  onClick={() => setIsMainSidenavOpen(true)}
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                >
                  Open Side Panel
                </button>
              )}

              {/* Tabs container — always rendered */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <nav className="flex">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AnalysisTab)}
                        className={`
                          flex-1 py-4 px-4 text-center font-semibold text-sm transition-all duration-200
                          border-b-3 relative
                          ${
                            activeTab === tab.id
                              ? 'border-b-4 border-blue-600 text-blue-700 bg-white shadow-sm'
                              : 'border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          }
                        `}
                      >
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Documentation — always accessible */}
                  {activeTab === 'documentation' && <Documentation />}

                  {/* Dataset-dependent tabs */}
                  {activeTab !== 'documentation' && (
                    sessionId ? (
                      isLoadingInfo ? (
                        <div className="bg-white rounded-lg p-12">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 text-lg font-medium">Loading dataset information...</p>
                            <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the data</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {activeTab === 'exploration' && (
                            <DatasetExploration sessionId={sessionId} />
                          )}

                          {activeTab === 'cluster_selection' && (
                            <ClusterSelection sessionId={sessionId} />
                          )}

                          {activeTab === 'dge' && datasetInfo && (
                            <DifferentialExpression
                              sessionId={sessionId}
                              filteredSessionId={filteredSessionId}
                              cellTypes={datasetInfo.cell_types}
                            />
                          )}

                          {activeTab === 'pseudobulk' && (
                            <PseudobulkAnalysis sessionId={sessionId} />
                          )}

                          {activeTab === 'geneset' && (
                            <GeneSetEnrichment sessionId={sessionId} />
                          )}
                        </>
                      )
                    ) : (
                      <div className="bg-white rounded-lg p-12">
                        <div className="text-center text-gray-500">
                          <svg
                            className="mx-auto h-16 w-16 text-gray-400 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-xl font-medium mb-2">No dataset loaded</p>
                          <p className="text-sm">Select and load a dataset to begin analysis</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            MASLDatlas v2.0 - Powered by FastAPI, React, and Scanpy
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

