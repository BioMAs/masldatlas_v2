import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Plus, X, Download, Wand2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/api';
import { downloadImageAsPNG } from '../utils/downloadImage';

interface GeneSetEnrichmentProps {
  sessionId: string;
  /** Optional DGE results — enables auto-fill of upregulated genes */
  deseqResults?: any[];
}

export const GeneSetEnrichment: React.FC<GeneSetEnrichmentProps> = ({ sessionId, deseqResults }) => {
  const [genesetName, setGenesetName] = useState('CustomGeneSet');
  const [geneInput, setGeneInput] = useState('');
  const [genes, setGenes] = useState<string[]>([]);

  // Auto-fill upregulated genes when DGE results first arrive
  const prevLenRef = useRef(0);
  useEffect(() => {
    if (!deseqResults || deseqResults.length === 0) return;
    if (deseqResults.length === prevLenRef.current) return;
    prevLenRef.current = deseqResults.length;
    if (genes.length > 0) return; // don't overwrite user's input
    const upGenes = deseqResults
      .filter((r: any) => {
        const p = r.padj ?? r.pvalue ?? 1;
        return r.log2FoldChange > 0.5 && p < 0.05;
      })
      .map((r: any) => r.gene)
      .filter(Boolean) as string[];
    if (upGenes.length > 0) setGenes(upGenes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deseqResults]);

  const handleUseDEGs = (direction: 'up' | 'down') => {
    if (!deseqResults) return;
    const filtered = deseqResults
      .filter((r: any) => {
        const p = r.padj ?? r.pvalue ?? 1;
        return (direction === 'up' ? r.log2FoldChange > 0.5 : r.log2FoldChange < -0.5) && p < 0.05;
      })
      .map((r: any) => r.gene)
      .filter(Boolean) as string[];
    setGenes(filtered);
    setGenesetName(direction === 'up' ? 'Upregulated_DEGs' : 'Downregulated_DEGs');
  };
  
  // Dual mode state
  const [isDualMode, setIsDualMode] = useState(false);
  const [geneset2Name, setGeneset2Name] = useState('GeneSet2');
  const [geneInput2, setGeneInput2] = useState('');
  const [genes2, setGenes2] = useState<string[]>([]);

  // Single geneset mutation
  const singleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `/enrichment/custom-geneset/${sessionId}`,
        { geneset: { [genesetName]: genes }, geneset_name: genesetName }
      );
      return data;
    }
  });

  // Dual geneset mutation
  const dualMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `/enrichment/dual-geneset/${sessionId}`,
        {
          geneset1: { [genesetName]: genes },
          geneset2: { [geneset2Name]: genes2 },
          geneset1_name: genesetName,
          geneset2_name: geneset2Name,
        }
      );
      return data;
    }
  });

  const handleAddGene = (geneList: string, setGeneList: React.Dispatch<React.SetStateAction<string[]>>) => {
    const newGenes = geneList
      .split(/[,\s\n]+/)
      .map(g => g.trim().toUpperCase())
      .filter(g => g.length > 0);
    
    setGeneList(prev => [...new Set([...prev, ...newGenes])]);
  };

  const handleRemoveGene = (gene: string, geneList: string[], setGeneList: (genes: string[]) => void) => {
    setGeneList(geneList.filter(g => g !== gene));
  };

  const handleRunAnalysis = () => {
    if (isDualMode && genes.length > 0 && genes2.length > 0) {
      dualMutation.mutate();
    } else if (!isDualMode && genes.length > 0) {
      singleMutation.mutate();
    } else {
      alert('Please add at least one gene in each list');
    }
  };

  const isPending = singleMutation.isPending || dualMutation.isPending;
  const results = isDualMode ? dualMutation.data : singleMutation.data;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Custom Gene Set Enrichment
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick-fill buttons when DGE results are available */}
          {deseqResults && deseqResults.length > 0 && (
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-gray-500">From DGE:</span>
              <button
                onClick={() => handleUseDEGs('up')}
                className="text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
              >
                ▲ Upregulated
              </button>
              <button
                onClick={() => handleUseDEGs('down')}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                ▼ Downregulated
              </button>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDualMode}
              onChange={(e) => setIsDualMode(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Mode Comparaison (2 genesets)</span>
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Analysez l'enrichissement de vos propres signatures génétiques sur les données scRNA-seq
      </p>

      <div className={`grid ${isDualMode ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Gene Set 1 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du Gene Set {isDualMode ? '1' : ''}
            </label>
            <input
              type="text"
              value={genesetName}
              onChange={(e) => setGenesetName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g. NASH_Signature"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gènes (un par ligne, séparés par virgule ou espace)
            </label>
            <textarea
              value={geneInput}
              onChange={(e) => setGeneInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows={6}
              placeholder="PPARG&#10;SREBF1&#10;FASN&#10;SCD&#10;ACACA"
            />
            <button
              onClick={() => {
                handleAddGene(geneInput, setGenes);
                setGeneInput('');
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter les gènes
            </button>
          </div>

          {genes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Gènes ajoutés ({genes.length})
              </h4>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                {genes.map(gene => (
                  <span
                    key={gene}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {gene}
                    <button
                      onClick={() => handleRemoveGene(gene, genes, setGenes)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gene Set 2 (only in dual mode) */}
        {isDualMode && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Gene Set 2
              </label>
              <input
                type="text"
                value={geneset2Name}
                onChange={(e) => setGeneset2Name(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g. Control_Signature"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gènes
              </label>
              <textarea
                value={geneInput2}
                onChange={(e) => setGeneInput2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                rows={6}
                placeholder="Gene list for comparison"
              />
              <button
                onClick={() => {
                  handleAddGene(geneInput2, setGenes2);
                  setGeneInput2('');
                }}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter les gènes
              </button>
            </div>

            {genes2.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Gènes ajoutés ({genes2.length})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                  {genes2.map(gene => (
                    <span
                      key={gene}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                    >
                      {gene}
                      <button
                        onClick={() => handleRemoveGene(gene, genes2, setGenes2)}
                        className="hover:text-green-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Run Analysis Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleRunAnalysis}
          disabled={isPending || genes.length === 0 || (isDualMode && genes2.length === 0)}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-medium"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Analysis in progress...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {isDualMode ? 'Compare Gene Sets' : 'Run Enrichment'}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-8 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              ✅ Analyse terminée !
              {isDualMode ? (
                <>
                  <br />
                  Comparaison: <strong>{results.geneset1_name}</strong> vs <strong>{results.geneset2_name}</strong>
                  <br />
                  {results.n_cells} cellules analysées
                </>
              ) : (
                <>
                  <br />
                  Gene Set: <strong>{results.geneset_name}</strong>
                  <br />
                  {results.n_cells} cellules analysées
                </>
              )}
            </p>
          </div>

          {/* UMAP Visualization */}
          {!isDualMode && results.umap_image && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">UMAP - Score d'Enrichissement</h3>
                <button
                  onClick={() => downloadImageAsPNG(results.umap_image, `${genesetName}_umap`)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
              <img src={results.umap_image} alt="UMAP" className="w-full h-auto rounded" />
            </div>
          )}

          {/* Dual UMAP */}
          {isDualMode && results.dual_umap_image && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">UMAP - Comparaison des Scores</h3>
                <button
                  onClick={() => downloadImageAsPNG(results.dual_umap_image, 'dual_geneset_umap')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
              <img src={results.dual_umap_image} alt="Dual UMAP" className="w-full h-auto rounded" />
            </div>
          )}

          {/* Violin Plot */}
          {!isDualMode && results.violin_image && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Distribution par Type Cellulaire</h3>
                <button
                  onClick={() => downloadImageAsPNG(results.violin_image, `${genesetName}_violin`)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
              <img src={results.violin_image} alt="Violin Plot" className="w-full h-auto rounded" />
            </div>
          )}

          {/* Dual Violin */}
          {isDualMode && results.dual_violin_image && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Distribution par Type Cellulaire - Comparaison</h3>
                <button
                  onClick={() => downloadImageAsPNG(results.dual_violin_image, 'dual_geneset_violin')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
              <img src={results.dual_violin_image} alt="Dual Violin" className="w-full h-auto rounded" />
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {(singleMutation.isError || dualMutation.isError) && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            ❌ Erreur: {(singleMutation.error as Error)?.message || (dualMutation.error as Error)?.message}
          </p>
        </div>
      )}
    </div>
  );
};
