/**
 * DotPlot Visualization Component — client-side Plotly rendering
 */
import Plot from 'react-plotly.js';
import { useDotPlotVisualization } from '../hooks/useDataset';
import { useFullscreen } from '../hooks/useFullscreen';
import { ActionButtons } from './ui/ActionButtons';
import { FullscreenModal } from './ui/FullscreenModal';

interface DotPlotVisualizationProps {
  sessionId: string;
  genes: string[];
  groupby?: string;
}

export function DotPlotVisualization({ sessionId, genes, groupby = 'CellType' }: DotPlotVisualizationProps) {
  const { data, isLoading } = useDotPlotVisualization(sessionId, genes, groupby);
  const { isFullscreen, openFullscreen, closeFullscreen } = useFullscreen();

  const title = `Dot Plot — ${genes.length} Gene${genes.length !== 1 ? 's' : ''}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data || !data.genes || data.genes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No dot plot data available</p>
      </div>
    );
  }

  const { groups, mean_expression, fraction_expressing } = data;

  // Build flat arrays for Plotly scatter (one bubble per gene×group pair)
  const xVals: string[] = [];
  const yVals: string[] = [];
  const sizeVals: number[] = [];
  const colorVals: number[] = [];
  const hoverTexts: string[] = [];

  for (const gene of genes) {
    for (const group of groups) {
      const meanVal = mean_expression[gene]?.[group] ?? 0;
      const fracVal = fraction_expressing[gene]?.[group] ?? 0;
      xVals.push(gene);
      yVals.push(group);
      sizeVals.push(Math.max(4, fracVal * 30));   // bubble size 4–30px
      colorVals.push(meanVal);
      hoverTexts.push(
        `<b>${gene}</b> in <b>${group}</b><br>Mean expression: ${meanVal.toFixed(3)}<br>Fraction expressing: ${(fracVal * 100).toFixed(1)}%`
      );
    }
  }

  const plotData: Plotly.Data[] = [{
    type: 'scatter',
    mode: 'markers',
    x: xVals,
    y: yVals,
    marker: {
      size: sizeVals,
      color: colorVals,
      colorscale: 'Reds',
      showscale: true,
      colorbar: { title: 'Mean expr.', thickness: 12, len: 0.7 },
      line: { width: 0.5, color: 'rgba(0,0,0,0.3)' },
    },
    hoverinfo: 'text',
    hovertext: hoverTexts,
    showlegend: false,
  } as any];

  const dynamicHeight = Math.max(300, groups.length * 28 + 60);

  const layout: Partial<Plotly.Layout> = {
    title: { text: title, font: { size: 14 } },
    xaxis: { title: { text: 'Gene' }, tickangle: -45, showgrid: false },
    yaxis: { title: { text: groupby }, showgrid: true, gridcolor: '#f0f0f0' },
    hovermode: 'closest',
    margin: { t: 40, b: 100, l: 120, r: 40 },
    height: dynamicHeight,
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
  };

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    toImageButtonOptions: { format: 'png', filename: `dotplot_${genes.slice(0, 3).join('_')}`, scale: 2 },
  };

  const PlotComponent = (
    <Plot data={plotData} layout={layout} config={config} style={{ width: '100%' }} useResizeHandler />
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-4 relative">
        <ActionButtons onFullscreen={openFullscreen} position="top-right" />
        {PlotComponent}
        <div className="mt-2 text-xs text-gray-500 overflow-x-auto">
          Genes: {genes.join(', ')}
        </div>
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

