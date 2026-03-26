/**
 * RankGenesPlot — Ranked bar chart of top up- and down-regulated genes.
 *
 * Shows the top N up-regulated genes (red) and top N down-regulated genes
 * (blue), ordered by Log2FoldChange magnitude, as a horizontal bar chart.
 */
import React, { useMemo } from 'react';

interface Gene {
  gene: string;
  log2FoldChange: number;
  padj?: number;
  pvalue?: number;
}

interface RankGenesPlotProps {
  data: Gene[];
  /** Number of top genes shown per direction (default: 15) */
  topN?: number;
  /** P-value threshold for labelling (default: 0.05) */
  pThreshold?: number;
  title?: string;
}

export const RankGenesPlot: React.FC<RankGenesPlotProps> = ({
  data,
  topN = 15,
  pThreshold = 0.05,
  title = 'Top Differentially Expressed Genes',
}) => {
  const genes = useMemo(() => {
    if (!data || data.length === 0) return [];

    const filtered = data
      .filter((g) => g.gene && g.log2FoldChange !== undefined && g.log2FoldChange !== null)
      .filter((g) => {
        const p = g.padj ?? g.pvalue ?? 1;
        return p <= pThreshold;
      });

    const up = [...filtered]
      .filter((g) => g.log2FoldChange > 0)
      .sort((a, b) => b.log2FoldChange - a.log2FoldChange)
      .slice(0, topN);

    const down = [...filtered]
      .filter((g) => g.log2FoldChange < 0)
      .sort((a, b) => a.log2FoldChange - b.log2FoldChange)
      .slice(0, topN);

    // Combine: up genes first (top to bottom = highest FC), then down genes
    return [...up.reverse(), ...down];
  }, [data, topN, pThreshold]);

  if (genes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        No significant genes to display (adjust filters).
      </div>
    );
  }

  const maxAbs = Math.max(...genes.map((g) => Math.abs(g.log2FoldChange)));
  const BAR_MAX_PX = 260; // pixels for the full bar width
  const ROW_HEIGHT = 22;
  const LABEL_WIDTH = 110;
  const VALUE_WIDTH = 52;
  const SVG_WIDTH = LABEL_WIDTH + BAR_MAX_PX * 2 + VALUE_WIDTH + 24; // bidirectional
  const SVG_HEIGHT = genes.length * ROW_HEIGHT + 32;

  const centerX = LABEL_WIDTH + BAR_MAX_PX;

  return (
    <div className="overflow-auto">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 px-1">{title}</h4>
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        style={{ display: 'block', fontFamily: 'inherit' }}
      >
        {/* Zero centre line */}
        <line
          x1={centerX}
          y1={8}
          x2={centerX}
          y2={SVG_HEIGHT - 4}
          stroke="#9ca3af"
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* Column header */}
        <text x={centerX} y={12} textAnchor="middle" fontSize={9} fill="#6b7280">
          Log2FC
        </text>

        {genes.map((g, i) => {
          const y = 20 + i * ROW_HEIGHT;
          const lfc = g.log2FoldChange;
          const barLen = (Math.abs(lfc) / maxAbs) * BAR_MAX_PX;
          const isUp = lfc >= 0;
          const barX = isUp ? centerX : centerX - barLen;
          const fill = isUp ? '#ef4444' : '#3b82f6';
          const pAdj = g.padj ?? g.pvalue ?? 1;
          const isHighSig = pAdj < 0.001;

          return (
            <g key={g.gene}>
              {/* Gene label */}
              <text
                x={LABEL_WIDTH - 6}
                y={y + ROW_HEIGHT / 2 + 1}
                textAnchor="end"
                fontSize={isHighSig ? 9.5 : 9}
                fontWeight={isHighSig ? '600' : '400'}
                fill="#374151"
              >
                {g.gene}
              </text>

              {/* Bar */}
              <rect
                x={barX}
                y={y + 3}
                width={Math.max(barLen, 1)}
                height={ROW_HEIGHT - 6}
                fill={fill}
                opacity={0.8}
                rx={2}
              />

              {/* Value label */}
              <text
                x={isUp ? centerX + barLen + 4 : centerX - barLen - 4}
                y={y + ROW_HEIGHT / 2 + 1}
                textAnchor={isUp ? 'start' : 'end'}
                fontSize={8}
                fill="#6b7280"
              >
                {lfc > 0 ? '+' : ''}
                {lfc.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Axes labels */}
        <text x={LABEL_WIDTH + 4} y={SVG_HEIGHT - 2} fontSize={8} fill="#9ca3af">
          ← Down
        </text>
        <text x={centerX + 4} y={SVG_HEIGHT - 2} fontSize={8} fill="#9ca3af">
          Up →
        </text>
      </svg>

      <p className="text-xs text-gray-400 mt-1 px-1">
        Showing top {topN} up &amp; down genes · adj. p ≤ {pThreshold}
      </p>
    </div>
  );
};
