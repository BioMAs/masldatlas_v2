/**
 * Dataset selection component
 */
import { useState } from 'react';
import { useOrganisms, useLoadDataset } from '../hooks/useDataset';
import type { OrganismType } from '../types/api';
import { Spinner } from './ui/Spinner';

interface DatasetSelectorProps {
  onDatasetLoaded?: (sessionId: string) => void;
}

export function DatasetSelector({ onDatasetLoaded }: DatasetSelectorProps) {
  const [selectedOrganism, setSelectedOrganism] = useState<OrganismType | ''>('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [sizeOption, setSizeOption] = useState('subset');

  const { 
    data: organisms, 
    isLoading: organismsLoading,
    isError: organismsError,
    error: organismsErrorDetail 
  } = useOrganisms();
  const loadDataset = useLoadDataset();

  const handleLoad = async () => {
    if (!selectedOrganism || !selectedDataset) return;

    try {
      const result = await loadDataset.mutateAsync({
        organism: selectedOrganism as OrganismType,
        dataset_name: selectedDataset,
        size_option: sizeOption,
      });
      
      // Notify parent component
      if (onDatasetLoaded) {
        onDatasetLoaded(result.session_id);
      }
    } catch (error) {
      console.error('Failed to load dataset:', error);
    }
  };

  if (organismsLoading) {
    return <div className="animate-pulse">Loading organisms...</div>;
  }

  if (organismsError) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Load Dataset</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">Failed to load available organisms</p>
          <p className="text-sm text-red-600 mt-1">
            {organismsErrorDetail instanceof Error ? organismsErrorDetail.message : 'Unknown error occurred'}
          </p>
          <p className="text-xs text-red-500 mt-2">
            Please ensure the backend server is running and accessible.
          </p>
        </div>
      </div>
    );
  }

  const datasets = selectedOrganism && organisms?.[selectedOrganism]?.datasets || [];

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800">Load Dataset</h2>

      {/* Organism Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Organism
        </label>
        <select
          value={selectedOrganism}
          onChange={(e) => {
            setSelectedOrganism(e.target.value as OrganismType | '');
            setSelectedDataset('');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select an organism...</option>
          {organisms &&
            Object.entries(organisms).map(([key, data]) => (
              <option key={key} value={key}>
                {data.status === 'Available' ? '[Available]' : '[In Progress]'} {key}
              </option>
            ))}
        </select>
      </div>

      {/* Dataset Selection */}
      {selectedOrganism && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Dataset
          </label>
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a dataset...</option>
            {datasets.map((dataset: string) => (
              <option key={dataset} value={dataset}>
                {dataset}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Size Option */}
      {selectedDataset && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dataset Size
          </label>
          <select
            value={sizeOption}
            onChange={(e) => setSizeOption(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="subset">Fast (Visualization Optimized)</option>
            <option value="full">Full Dataset (Raw Data)</option>
            <option value="large">Large (Optimized)</option>
            <option value="medium">Medium</option>
            <option value="small">Small</option>
          </select>
        </div>
      )}

      {/* Load Button */}
      <button
        onClick={handleLoad}
        disabled={!selectedOrganism || !selectedDataset || loadDataset.isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loadDataset.isPending ? (
          <>
            <Spinner className="text-white" />
            <span>Loading...</span>
          </>
        ) : (
          'Load Dataset'
        )}
      </button>

      {/* Success Message */}
      {loadDataset.isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium">Dataset loaded successfully!</p>
          <p className="text-sm text-green-600 mt-1">
            Cells: {loadDataset.data.info.n_cells.toLocaleString()} | Genes:{' '}
            {loadDataset.data.info.n_genes.toLocaleString()}
          </p>
        </div>
      )}

      {/* Error Message */}
      {loadDataset.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">Failed to load dataset</p>
          <p className="text-sm text-red-600 mt-1">
             {/* @ts-ignore */}
             {loadDataset.error?.response?.data?.detail || loadDataset.error.message}
          </p>
        </div>
      )}
    </div>
  );
}
