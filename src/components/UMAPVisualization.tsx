/**
 * UMAP Visualization Component — client-side Plotly ScatterGL rendering
 */
import Plot from 'react-plotly.js';
import { useUMAPVisualization } from '../hooks/useDataset';
import { useFullscreen } from '../hooks/useFullscreen';
import { ActionButtons } from './ui/ActionButtons';
import { FullscreenModal } from './ui/FullscreenModal';

// Colorblind-friendly palette for categorical data
const CATEGORY_COLORS = [
  '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd',
  '#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf',
  '#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5',
  '#c49c94','#f7b6d2','#c7c7c7','#dbdb8d','#9edae5',
];

interface UMAPVisualizationProps {
  sessionId: string;
  colorBy?: string;
  gene?: string;
}

export function UMAPVisualization({ sessionId, colorBy = 'CellType', gene }: UMAPVisualizationProps) {
  const actualColorBy = gene || colorBy;
  const { data: umapData, isLoading } = useUMAPVisualization(sessionId, actualColorBy);
  const { isFullscreen, openFullscreen, closeFullscreen } = useFullscreen();

  const title = gene ? `UMAP — ${gene} Expression` : `UMAP — ${colorBy}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!umapData) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No UMAP data available</p>
      </div>
    );
  }

  const { x, y, categories, unique_categories, is_continuous } = umapData;

  // Build Plotly traces
  let plotData: Plotly.Data[];

  if (is_continuous) {
    // Single trace with colour scale for gene expression
    plotData = [{
      type: 'scattergl',
      mode: 'markers',
      x,
      y,
      marker: {
        size: 3,
        color: categories as number[],
        colorscale: 'Viridis',
        showscale: true,
        colorbar: { title: actualColorBy, thickness: 12, len: 0.8 },
        opacity: 0.8,
      },
      hovertemplate: `${actualColorBy}: %{marker.color:.3f}<extra></extra>`,
      showlegend: false,
    } as any];
  } else {
    // One trace per category for legend + toggle
    plotData = unique_categories.map((cat, idx) => {
      const mask = (categories as string[]).map((c) => c === cat);
      return {
        type: 'scattergl',
        mode: 'markers',
        name: cat,
        x: x.filter((_, i) => mask[i]),
        y: y.filter((_, i) => mask[i]),
        marker: {
          size: 4,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          opacity: 0.75,
        },
        hovertemplate: `${actualColorBy}: ${cat}<extra></extra>`,
      } as any;
    });
  }

  const layout: Partial<Plotly.Layout> = {
    title: { text: title, font: { size: 14 } },
    xaxis: { title: { text: 'UMAP 1' }, showgrid: false, zeroline: false, showticklabels: false },
    yaxis: { title: { text: 'UMAP 2' }, showgrid: false, zeroline: false, showticklabels: false },
    hovermode: 'closest',
    margin: { t: 40, b: 40, l: 40, r: 20 },
    legend: { itemsizing: 'constant', font: { size: 11 } },
    plot_bgcolor: '#f9fafb',
    paper_bgcolor: '#ffffff',
  };

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
    toImageButtonOptions: { format: 'png', filename: `umap_${actualColorBy}`, scale: 2 },
  };

  const PlotComponent = (
    <Plot
      data={plotData}
      layout={layout}
      config={config}
      style={{ width: '100%', minHeight: '420px' }}
      useResizeHandler
    />
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-4 relative">
        <ActionButtons onFullscreen={openFullscreen} position="top-right" />
        {PlotComponent}
      </div>

      <FullscreenModal isOpen={isFullscreen} onClose={closeFullscreen} title={title}>
        <Plot
          data={plotData}
          layout={{ ...layout, height: window.innerHeight * 0.8, title: undefined }}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </FullscreenModal>
    </>
  );
}
