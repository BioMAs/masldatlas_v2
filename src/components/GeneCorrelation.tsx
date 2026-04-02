/**
 * Gene Correlation Component — Mode C: Calculate Co-Expression
 */
import { useState, useEffect } from 'react';
import { useGeneCorrelation, useTopCorrelatedGenes } from '../hooks/useAnalysis';
import { useUMAPVisualization } from '../hooks/useDataset';
import { GeneSelector } from './ui/GeneSelector';
import { RefreshCw, GitMerge } from 'lucide-react';
import Plot from 'react-plotly.js';
import type { UMAPDataResponse } from '../types/api';

const CATEGORY_COLORS = [
  '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd',
  '#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf',
  '#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5',
  '#c49c94','#f7b6d2','#c7c7c7','#dbdb8d','#9edae5',
];

interface GeneCorrelationProps {
  sessionId: string;
  availableGenes?: string[];
}

export function GeneCorrelation({ sessionId, availableGenes = [] }: GeneCorrelationProps) {
  const [gene1, setGene1] = useState('');
  const [gene2, setGene2] = useState('');
  const [method, setMethod] = useState<'spearman' | 'pearson'>('spearman');
  const [removeZeros, setRemoveZeros] = useState(false);
  const { mutate: calculateCorrelation, data: corrData, isPending } = useGeneCorrelation(sessionId);
  const { mutate: fetchTop1, data: top1Data, isPending: loadingTop1 } = useTopCorrelatedGenes();
  const { mutate: fetchTop2, data: top2Data, isPending: loadingTop2 } = useTopCorrelatedGenes();

  // UMAPs colored by gene expression
  const { data: umapGene1, isFetching: loadingUmap1 } = useUMAPVisualization(
    sessionId,
    gene1 || 'CellType',
    'CellType',
    []
  );
  const { data: umapGene2, isFetching: loadingUmap2 } = useUMAPVisualization(
    sessionId,
    gene2 || 'CellType',
    'CellType',
    []
  );

  const handleCalculate = () => {
    if (!gene1 || !gene2) return;
    calculateCorrelation({ gene1, gene2, method, remove_zeros: removeZeros });
  };

  // Once correlation runs, also fetch top correlated genes for each gene
  useEffect(() => {
    if (corrData && gene1) fetchTop1({ sessionId, gene: gene1, nTop: 20 });
    if (corrData && gene2) fetchTop2({ sessionId, gene: gene2, nTop: 20 });
  }, [corrData]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-800">Co-Expression Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Gene 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gene 1</label>
            <GeneSelector
              allGenes={availableGenes}
              selectedGenes={gene1 ? [gene1] : []}
              onChange={(genes) => setGene1(genes[0] || '')}
              placeholder="Search gene 1..."
              singleSelect={true}
            />
          </div>

          {/* Gene 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gene 2</label>
            <GeneSelector
              allGenes={availableGenes}
              selectedGenes={gene2 ? [gene2] : []}
              onChange={(genes) => setGene2(genes[0] || '')}
              placeholder="Search gene 2..."
              singleSelect={true}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mb-4">
          {/* Method */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Correlation Method</p>
            <div className="flex gap-4">
              {(['spearman', 'pearson'] as const).map((m) => (
                <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm capitalize">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Remove zeros */}
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={removeZeros}
              onChange={(e) => setRemoveZeros(e.target.checked)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-gray-700">Remove zero counts</span>
          </label>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!gene1 || !gene2 || isPending}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
          {isPending ? 'Calculating...' : 'Calculate Correlation'}
        </button>
      </div>

      {/* UMAPs side-by-side (gene1 & gene2) — shown as soon as genes are selected */}
      {(gene1 || gene2) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UMAPCard
            title={gene1 ? `${gene1} Expression` : 'Select Gene 1'}
            isLoading={loadingUmap1}
            umapData={gene1 ? umapGene1 : undefined}
            emptyText={!gene1 ? 'Select Gene 1 above' : 'No data'}
          />
          <UMAPCard
            title={gene2 ? `${gene2} Expression` : 'Select Gene 2'}
            isLoading={loadingUmap2}
            umapData={gene2 ? umapGene2 : undefined}
            emptyText={!gene2 ? 'Select Gene 2 above' : 'No data'}
          />
        </div>
      )}

      {/* Correlation results */}
      {corrData && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard color="blue" label="Correlation" value={corrData.correlation.toFixed(3)} />
            <StatCard color="purple" label="P-value" value={corrData.pvalue.toExponential(2)} />
            <StatCard color="green" label="Method" value={corrData.method} capitalize />
            <StatCard color="orange" label="N Cells" value={corrData.n_cells.toLocaleString()} />
          </div>

          {/* Scatter plot */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <Plot
              data={[
                {
                  x: corrData.expr1,
                  y: corrData.expr2,
                  mode: 'markers',
                  type: 'scatter',
                  marker: { size: 3, color: '#6366f1', opacity: 0.45 },
                  name: 'Expression',
                },
                (() => {
                  const n = corrData.expr1.length;
                  const sumX = corrData.expr1.reduce((a: number, b: number) => a + b, 0);
                  const sumY = corrData.expr2.reduce((a: number, b: number) => a + b, 0);
                  const sumXY = corrData.expr1.reduce((s: number, x: number, i: number) => s + x * corrData.expr2[i], 0);
                  const sumX2 = corrData.expr1.reduce((s: number, x: number) => s + x * x, 0);
                  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                  const intercept = (sumY - slope * sumX) / n;
                  return {
                    x: corrData.expr1,
                    y: corrData.expr1.map((x: number) => slope * x + intercept),
                    mode: 'lines' as const,
                    type: 'scatter' as const,
                    line: { color: '#ef4444', width: 2 },
                    name: 'Trend',
                  };
                })(),
              ]}
              layout={{
                title: {
                  text: `${gene1} vs ${gene2} — r = ${corrData.correlation.toFixed(3)}, p = ${corrData.pvalue.toExponential(2)}`,
                },
                xaxis: { title: `${gene1} Expression` },
                yaxis: { title: `${gene2} Expression` },
                hovermode: 'closest',
                showlegend: true,
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                margin: { t: 50, l: 60, r: 20, b: 60 },
              } as any}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                toImageButtonOptions: {
                  format: 'png',
                  filename: `correlation_${gene1}_${gene2}`,
                  height: 600, width: 800, scale: 2,
                },
              }}
              style={{ width: '100%', height: '450px' }}
            />
          </div>

          {/* Top correlated genes — 2 tables side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopGenesTable
              title={`Top Correlated Genes — ${gene1}`}
              isLoading={loadingTop1}
              data={top1Data?.top_genes}
            />
            <TopGenesTable
              title={`Top Correlated Genes — ${gene2}`}
              isLoading={loadingTop2}
              data={top2Data?.top_genes}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function UMAPCard({
  title, isLoading, umapData, emptyText,
}: {
  title: string; isLoading: boolean; umapData?: UMAPDataResponse; emptyText?: string;
}) {
  let plotData: Plotly.Data[] | null = null;
  if (umapData) {
    const { x, y, categories, unique_categories, is_continuous, color_by } = umapData;
    if (is_continuous) {
      plotData = [{
        type: 'scattergl', mode: 'markers', x, y,
        marker: { size: 3, color: categories as number[], colorscale: 'Viridis', showscale: true, colorbar: { title: { text: color_by }, thickness: 10, len: 0.7 }, opacity: 0.8 },
        hovertemplate: `${color_by}: %{marker.color:.3f}<extra></extra>`,
        showlegend: false,
      } as any];
    } else {
      plotData = (unique_categories ?? []).map((cat: string, idx: number) => {
        const mask = (categories as string[]).map((c) => c === cat);
        return {
          type: 'scattergl', mode: 'markers', name: cat,
          x: x.filter((_, i) => mask[i]),
          y: y.filter((_, i) => mask[i]),
          marker: { size: 3, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length], opacity: 0.75 },
          hovertemplate: `${color_by}: ${cat}<extra></extra>`,
        } as any;
      });
    }
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 min-h-[300px] flex flex-col">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        {isLoading ? (
          <RefreshCw className="animate-spin text-indigo-400 w-7 h-7" />
        ) : plotData ? (
          <Plot
            data={plotData}
            layout={{
              xaxis: { title: { text: 'UMAP 1' }, showgrid: false, zeroline: false, showticklabels: false },
              yaxis: { title: { text: 'UMAP 2' }, showgrid: false, zeroline: false, showticklabels: false },
              hovermode: 'closest', margin: { t: 10, b: 30, l: 30, r: 10 },
              legend: { itemsizing: 'constant', font: { size: 10 } },
              plot_bgcolor: '#f9fafb', paper_bgcolor: '#ffffff',
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '280px' }}
            useResizeHandler
          />
        ) : (
          <span className="text-sm text-gray-400">{emptyText || 'No data'}</span>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, capitalize }: {
  label: string; value: string; color: 'blue' | 'purple' | 'green' | 'orange'; capitalize?: boolean;
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

function TopGenesTable({ title, isLoading, data }: {
  title: string;
  isLoading: boolean;
  data?: Array<{ gene: string; correlation: number }>;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase">Gene</th>
                <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Correlation</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.gene} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-1.5 pr-4 text-gray-400 text-xs">{i + 1}</td>
                  <td className="py-1.5 pr-4 font-mono font-medium text-gray-800">{row.gene}</td>
                  <td className="py-1.5 text-right">
                    <span className={`font-medium ${row.correlation >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {row.correlation.toFixed(3)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">Run correlation to see top genes</p>
      )}
    </div>
  );
}

