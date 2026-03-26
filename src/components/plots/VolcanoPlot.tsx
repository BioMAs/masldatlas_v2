import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface VolcanoPlotProps {
  data: Array<{
    gene: string;
    log2FoldChange: number;
    pvalue: number; // or padj
    padj?: number;
  }>;
  logFcThreshold?: number;
  pValueThreshold?: number;
  title?: string;
}

export function VolcanoPlot({ 
  data, 
  logFcThreshold = 1, 
  pValueThreshold = 0.05, 
  title = "Volcano Plot" 
}: VolcanoPlotProps) {

  const plotData = useMemo(() => {
    const up = [];
    const down = [];
    const ns = [];

    // Pre-calculate -log10(p-value) for safer tooltips and faster plotting
    // Handle small p-values (0 replaced by small number to avoid Infinity)
    const points = data.map(d => {
        const p = d.padj !== undefined && d.padj !== null ? d.padj : d.pvalue;
        const negLogP = p > 0 ? -Math.log10(p) : 310; // Cap at max float
        return { ...d, negLogP, pUsed: p };
    });

    for (const d of points) {
      if ((d.pUsed !== null && d.pUsed < pValueThreshold) && d.log2FoldChange > logFcThreshold) {
        up.push(d);
      } else if ((d.pUsed !== null && d.pUsed < pValueThreshold) && d.log2FoldChange < -logFcThreshold) {
        down.push(d);
      } else {
        ns.push(d);
      }
    }

    return [
      {
        x: ns.map(d => d.log2FoldChange),
        y: ns.map(d => d.negLogP),
        text: ns.map(d => d.gene),
        mode: 'markers',
        type: 'scattergl', // Use WebGL for performance
        name: 'Not Significant',
        marker: { color: 'grey', opacity: 0.5, size: 4 },
        hovertemplate: '<b>%{text}</b><br>Log2FC: %{x:.2f}<br>-Log10(P): %{y:.2f}<extra></extra>'
      },
      {
        x: up.map(d => d.log2FoldChange),
        y: up.map(d => d.negLogP),
        text: up.map(d => d.gene),
        mode: 'markers',
        type: 'scattergl',
        name: 'Upregulated',
        marker: { color: 'red', size: 6 },
        hovertemplate: '<b>%{text}</b><br>Log2FC: %{x:.2f}<br>-Log10(P): %{y:.2f}<extra></extra>'
      },
      {
        x: down.map(d => d.log2FoldChange),
        y: down.map(d => d.negLogP),
        text: down.map(d => d.gene),
        mode: 'markers',
        type: 'scattergl',
        name: 'Downregulated',
        marker: { color: 'blue', size: 6 },
        hovertemplate: '<b>%{text}</b><br>Log2FC: %{x:.2f}<br>-Log10(P): %{y:.2f}<extra></extra>'
      }
    ];
  }, [data, logFcThreshold, pValueThreshold]);

  return (
    <div className="w-full h-96 bg-white rounded-lg p-2 shadow-sm">
      <Plot
        data={plotData as any}
        layout={{
          title: { text: title },
          autosize: true,
          margin: { t: 40, r: 20, b: 40, l: 50 },
          xaxis: { title: { text: 'Log2 Fold Change' }, zeroline: false },
          yaxis: { title: { text: '-Log10(adj. p-value)' }, zeroline: false },
          hovermode: 'closest',
          showlegend: true,
          legend: { x: 1, xanchor: 'right', y: 1 }
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: true, displaylogo: false }}
      />
    </div>
  );
}
