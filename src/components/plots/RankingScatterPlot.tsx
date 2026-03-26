import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface RankingScatterPlotProps {
  data: Array<{
    gene: string;
    log2FoldChange: number;
    pvalue: number;
    padj?: number;
    score: number;
  }>;
  title?: string;
  topLabels?: number;
}

export function RankingScatterPlot({ 
  data, 
  title = "Gene Ranking",
  topLabels = 10
}: RankingScatterPlotProps) {

  const plotData = useMemo(() => {
    // Sort by score (descending) and add ranking
    const rankedData = [...data]
      .sort((a, b) => b.score - a.score)
      .map((d, index) => ({
        ...d,
        ranking: index + 1
      }));

    // All gene names for hover
    const allGeneNames = rankedData.map(d => d.gene);
    
    // Limited text labels for display (top genes only)
    const displayLabels = rankedData.map((d, idx) => 
      idx < topLabels ? d.gene : ''
    );

    return [
      {
        x: rankedData.map(d => d.ranking),
        y: rankedData.map(d => d.score),
        text: displayLabels,
        customdata: allGeneNames,
        mode: 'markers+text',
        type: 'scattergl',
        name: 'Genes',
        marker: { color: 'grey', opacity: 0.6, size: 5 },
        textposition: 'top center',
        textfont: { size: 9, color: 'grey' },
        hovertemplate: '<b>%{customdata}</b><br>Rank: %{x}<br>Score: %{y:.2f}<extra></extra>'
      }
    ];
  }, [data, topLabels]);

  return (
    <div className="w-full h-96 bg-white rounded-lg p-2 shadow-sm">
      <Plot
        data={plotData as any}
        layout={{
          title: { text: title },
          autosize: true,
          margin: { t: 40, r: 20, b: 40, l: 50 },
          xaxis: { title: 'Ranking', zeroline: false },
          yaxis: { title: 'Score', zeroline: false },
          hovermode: 'closest',
          showlegend: true,
          legend: { x: 1, xanchor: 'right', y: 1 }
        } as any}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: true, displaylogo: false }}
      />
    </div>
  );
}
