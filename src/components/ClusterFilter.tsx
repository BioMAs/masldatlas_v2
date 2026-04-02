import { useState } from 'react';
import { Filter, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

interface ClusterFilterProps {
  sessionId: string;
  cellTypes: string[];
  onFilterApplied: (filteredInfo: any) => void;
}

export const ClusterFilter: React.FC<ClusterFilterProps> = ({
  sessionId,
  cellTypes,
  onFilterApplied
}) => {
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mutation to apply the filter
  const filterMutation = useMutation({
    mutationFn: async (clusters: string[]) => {
      const response = await apiClient.post(
        `/analysis/filter-by-clusters/${sessionId}`,
        clusters
      );
      return response.data;
    },
    onSuccess: (data) => {
      onFilterApplied(data);
    }
  });

  const handleToggleCluster = (cluster: string) => {
    setSelectedClusters(prev => {
      if (prev.includes(cluster)) {
        return prev.filter(c => c !== cluster);
      } else {
        return [...prev, cluster];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedClusters([...cellTypes]);
  };

  const handleClearAll = () => {
    setSelectedClusters([]);
  };

  const handleApplyFilter = () => {
    if (selectedClusters.length === 0) {
      alert('Please select at least one cluster');
      return;
    }
    filterMutation.mutate(selectedClusters);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Filter by Clusters
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="mb-3 flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
            >
              Deselect All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded">
            {cellTypes.map(cluster => (
              <label
                key={cluster}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedClusters.includes(cluster)
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedClusters.includes(cluster)}
                  onChange={() => handleToggleCluster(cluster)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm truncate" title={cluster}>
                  {cluster}
                </span>
                {selectedClusters.includes(cluster) && (
                  <Check className="w-4 h-4 text-blue-600 ml-auto" />
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedClusters.length} cluster(s) selected out of {cellTypes.length}
            </div>
            
            <button
              onClick={handleApplyFilter}
              disabled={selectedClusters.length === 0 || filterMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {filterMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Filtering...
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4" />
                  Apply Filter
                </>
              )}
            </button>
          </div>

          {filterMutation.isSuccess && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                Filter applied successfully!<br />
                <strong>{filterMutation.data.n_cells_original}</strong> → <strong>{filterMutation.data.n_cells_filtered}</strong> cells
              </p>
            </div>
          )}

          {filterMutation.isError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                Filtering error: {filterMutation.error.message}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
