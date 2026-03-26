import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface DotPlotProps {
  data: Array<{
    term: string;
    padj: number;
    count: number;
    generatio: number; // e.g. 0.05
    log2FoldChange?: number; // Optional: Some enrichment returns this (like GSEANES)
  }>;
  title?: string;
  colorMetric?: 'padj' | 'log2FoldChange';
}

export function DotPlot({ 
  data, 
  title = "Enrichment Analysis",
  colorMetric = 'padj'
}: DotPlotProps) {

  const plotData = useMemo(() => {
    // Sort by GeneRatio for Y-axis (or count)
    // usually we want the most significant or highest ratio at the top
    const sortedData = [...data].sort((a, b) => a.generatio - b.generatio);

    // Prepare color array
    // For p-value: lower is better (Red), higher is worse (Blue). 
    // Usually standard is: 
    // Low P (High Sig) -> Red
    // High P (Low Sig) -> Blue
    // We can use 'Viridis' or 'RdBu'. 
    
    // BUT common convention in dotplot:
    // Color: p.adjust (Blue for low, Red for high? No usually Red for High Significance (Low P)).
    
    return [
      {
        x: sortedData.map(d => d.generatio),
        y: sortedData.map(d => d.term),
        mode: 'markers',
        marker: {
          size: sortedData.map(d => Math.min(Math.max(d.count, 5), 30)), // Scale size by count, clamped
          color: sortedData.map(d => colorMetric === 'padj' ? -Math.log10(d.padj) : d.log2FoldChange),
          colorscale: 'Viridis',
          colorbar: {
            title: colorMetric === 'padj' ? '-Log10(Padj)' : 'Log2FC',
            titleside: 'right'
          },
          showscale: true
        },
        text: sortedData.map(d => 
            `Term: ${d.term}<br>Count: ${d.count}<br>Ratio: ${d.generatio.toFixed(3)}<br>Padj: ${d.padj.toExponential(2)}`
        ),
        hovertemplate: '%{text}<extra></extra>',
        type: 'scatter'
      }
    ];
  }, [data, colorMetric]);

  return (
    <div className="w-full h-[600px] bg-white rounded-lg p-2 shadow-sm">
      <Plot
        data={plotData as any}
        layout={{
          title: { text: title },
          autosize: true,
          margin: { t: 40, r: 20, b: 80, l: 250 }, // Large left margin for Term names
          xaxis: { title: { text: 'Gene Ratio' }, zeroline: false },
          yaxis: { 
            title: { text: '' }, 
            automargin: true,
            type: 'category' 
          },
          hovermode: 'closest',
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: true, displaylogo: false }}
      />
    </div>
  );
}
