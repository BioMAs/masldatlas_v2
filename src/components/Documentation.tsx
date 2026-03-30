/**
 * Documentation page — mirrors the legacy Shiny "Documentation" tab
 * 6 sections: Overview, Getting Started, Analysis Workflow, Key Features,
 * Exporting Results, Troubleshooting + Citation
 */
import { useState } from 'react';
import {
  BookOpen,
  PlayCircle,
  GitBranch,
  Star,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-indigo-600">{section.icon}</span>
          <span className="font-semibold text-gray-800">{section.title}</span>
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="p-6 pt-2 bg-white border-t border-gray-100 prose prose-sm max-w-none text-gray-700">
          {section.content}
        </div>
      )}
    </div>
  );
}

export function Documentation() {
  const sections: Section[] = [
    {
      id: 'overview',
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Overview',
      content: (
        <div className="space-y-4">
          <p>
            <strong>MASLDatlas v2.0</strong> is an interactive single-cell RNA-seq (scRNA-seq) atlas
            dedicated to Metabolic dysfunction-Associated Steatotic Liver Disease (MASLD), formerly
            known as NAFLD/NASH.
          </p>
          <p>
            The atlas integrates data from three species — <em>Human</em>, <em>Mouse</em>, and{' '}
            <em>Zebrafish</em> — enabling cross-species comparison of hepatic cellular landscapes.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Human</strong>: GSE181483 — liver biopsies across MASLD stages (Healthy,
              Steatosis, NASH, Fibrosis, Cirrhosis)
            </li>
            <li>
              <strong>Mouse</strong>: GSE145086 — dietary and genetic MASLD mouse models
            </li>
            <li>
              <strong>Zebrafish</strong>: GSE181987 — larval high-fat diet model
            </li>
            <li>
              <strong>Integrated</strong>: Cross-species fibrotic cell atlas
            </li>
          </ul>
          <p>
            The backend is powered by <strong>FastAPI</strong> &amp; <strong>Scanpy</strong> for
            Python-based single-cell analysis, while the frontend is built with{' '}
            <strong>React + TypeScript</strong> and <strong>Plotly.js</strong> for interactive
            visualisations.
          </p>
        </div>
      ),
    },
    {
      id: 'getting-started',
      icon: <PlayCircle className="w-5 h-5" />,
      title: 'Getting Started',
      content: (
        <div className="space-y-4">
          <p>Follow these steps to load a dataset and begin your analysis:</p>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Select an organism</strong> using the left sidebar dropdown (Human, Mouse,
              Zebrafish, or Integrated).
            </li>
            <li>
              <strong>Choose a dataset</strong> from the list that appears.
            </li>
            <li>
              <strong>Select a size option</strong> if available:
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                <li>
                  <em>Full</em> — complete dataset (may be slow for large cohorts)
                </li>
                <li>
                  <em>sub20k / sub10k / sub5k</em> — downsampled subsets for faster exploration
                </li>
              </ul>
            </li>
            <li>
              Click <strong>"Load Dataset"</strong>. The dataset is loaded server-side; the cell
              count badge in the header will update.
            </li>
            <li>
              Optionally, apply a <strong>Cluster Filter</strong> in the left panel to restrict all
              downstream analyses to selected cell types.
            </li>
          </ol>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            💡 <strong>Tip</strong>: For initial exploration, use a sub10k subset. Switch to the full
            dataset for differential expression or pseudo-bulk analyses to maximise statistical power.
          </div>
        </div>
      ),
    },
    {
      id: 'workflow',
      icon: <GitBranch className="w-5 h-5" />,
      title: 'Analysis Workflow',
      content: (
        <div className="space-y-4">
          <p>The recommended analysis workflow follows five sequential tabs:</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                1
              </span>
              <div>
                <p className="font-semibold">Exploration</p>
                <p className="text-sm text-gray-600">
                  Visualise the global cell landscape via UMAP coloured by CellType or metadata.
                  Inspect top marker genes per cluster. Use the Dot Plot Explorer to compare gene
                  expression across cell types.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                2
              </span>
              <div>
                <p className="font-semibold">Cluster Selection</p>
                <p className="text-sm text-gray-600">
                  Zoom into specific cell populations. Visualise single gene expression, dual/single
                  gene-set module scores, or compute gene co-expression correlations.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                3
              </span>
              <div>
                <p className="font-semibold">Differential Expression</p>
                <p className="text-sm text-gray-600">
                  Run Scanpy-based DGE (Wilcoxon / t-test / LogReg) between any two groups or
                  clusters. Explore results via volcano plot, rank-genes plot, violin plots, and
                  functional enrichment (GO, KEGG, Reactome, WikiPathways) or Decoupler analyses
                  (CollecTRI TF activities, PROGENy pathway activities, MSigDB collections).
                  After DGE completes, the panel automatically switches to Functional Enrichment.
                  You can also pass DEGs directly to the <strong>Custom Gene Sets</strong> tab.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                4
              </span>
              <div>
                <p className="font-semibold">Pseudo-bulk Analysis</p>
                <p className="text-sm text-gray-600">
                  Aggregate counts by sample and run DESeq2-style differential analysis. Visualise
                  PCA, volcano, and run full Decoupler enrichment (CollecTRI Network, PROGENy
                  Targets, MSigDB running score).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                5
              </span>
              <div>
                <p className="font-semibold">Gene Set Enrichment (standalone)</p>
                <p className="text-sm text-gray-600">
                  Bring your own gene list for ULM-based enrichment independently of any DGE run.
                  Supports single-set and dual-set (up/down) modes. Quickly pre-fill with DGE
                  up- or down-regulated genes using the <strong>▲ Upregulated / ▼ Downregulated</strong>{' '}
                  buttons, or paste any custom gene list.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'features',
      icon: <Star className="w-5 h-5" />,
      title: 'Key Features',
      content: (
        <div className="space-y-3">
          <ul className="space-y-3">
              {[
              {
                name: 'Interactive UMAP',
                desc: 'Colour by any metadata column or gene expression. Zoom, pan, and hover for cell-level details.',
              },
              {
                name: 'Marker Genes',
                desc: 'One-vs-Rest Wilcoxon/t-test/LogReg rank genes groups with adjustable n_genes. Filterable by cluster.',
              },
              {
                name: 'Dot Plot Explorer',
                desc: 'Custom gene list dot plot showing mean expression and fraction expressing per cell type.',
              },
              {
                name: 'Gene Co-expression',
                desc: 'Pearson/Spearman correlation scatter plot with top correlated gene tables. Toggle zero-count removal.',
              },
              {
                name: 'Gene Set Scoring',
                desc: 'Single or dual gene set ULM module scores overlaid on UMAP and violin plots.',
              },
              {
                name: 'DGE + Volcano',
                desc: 'Interactive Plotly volcano with log2FC/p-value filters and violin slide-in panel per gene. Auto-opens Functional Enrichment on completion.',
              },
              {
                name: 'Functional Enrichment',
                desc: 'Enrichr-based ORA for GO Biological Process, KEGG, Reactome, and WikiPathways.',
              },
              {
                name: 'CollecTRI TF Activity',
                desc: 'Decoupler ULM inference of TF activities with barplot, volcano target plot, and regulatory network view.',
              },
              {
                name: 'PROGENy Pathway Activity',
                desc: 'Decoupler MLM inference of 14 signalling pathway activities with barplot and target-gene dual barplot.',
              },
              {
                name: 'MSigDB Gene Sets',
                desc: 'ORA on four MSigDB collections: Hallmark (50 sets), Chemical & Genetic Perturbations (C2 CGP), GO Biological Process (C5 BP), and Oncogenic Signatures (C6). Includes GSEA running-score curves.',
              },
              {
                name: 'Custom Gene Set Enrichment',
                desc: 'Bring-your-own gene list for ULM enrichment in single or dual (up/down) mode. Quick-fill from DGE up- or down-regulated genes.',
              },
              {
                name: 'Pseudo-bulk DESeq2',
                desc: 'Bulk-like differential analysis by aggregating counts per sample. PCA + volcano + enrichment.',
              },
            ].map((f) => (
              <li key={f.name} className="flex gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>
                  <strong>{f.name}</strong>: {f.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'exporting',
      icon: <Download className="w-5 h-5" />,
      title: 'Exporting Results',
      content: (
        <div className="space-y-4">
          <p>All major results can be downloaded directly from the interface:</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left">Result</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Format(s)</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Marker Genes table', 'CSV, Excel', 'Exploration → Download buttons'],
                ['DGE table', 'CSV', 'Differential Expression → table toolbar'],
                ['Enrichment results', 'CSV', 'Enrichment/Decoupler panel → toolbar'],
                ['Pseudo-bulk results', 'CSV', 'Pseudo-bulk → toolbar'],
                ['UMAP images', 'PNG', 'Each UMAP card → Download button'],
                ['Violin plots', 'PNG', 'Gene click panel → Download'],
                ['Rank-genes plot', 'PNG', 'Exploration → Download button'],
                ['Dot Plot', 'PNG', 'Dot Plot Explorer → Download'],
                ['Co-expression scatter', 'PNG', 'GeneCorrelation → Download'],
              ].map(([result, format, location]) => (
                <tr key={result} className="even:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2">{result}</td>
                  <td className="border border-gray-200 px-3 py-2 text-indigo-700 font-medium">
                    {format}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-500">{location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      icon: <HelpCircle className="w-5 h-5" />,
      title: 'Troubleshooting & Citation',
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2 text-gray-800">Common Issues</h4>
            <div className="space-y-3 text-sm">
              {[
                {
                  q: 'Dataset fails to load',
                  a: 'Ensure the backend is running (docker-compose up or uvicorn). Check that the .h5ad file is present in datasets/. Large files may take 30–60 s on first load.',
                },
                {
                  q: '"Gene not found" error',
                  a: 'Gene names are case-sensitive by default. The backend performs a case-insensitive fallback but may still fail if the gene is absent from the dataset. Verify against the marker genes table.',
                },
                {
                  q: 'Enrichment returns no results',
                  a: 'The Enrichr API requires internet access. Increase the number of input genes (lower log2FC/p-value thresholds). WikiPathways may have limited coverage for Mouse/Zebrafish.',
                },
                {
                  q: 'Decoupler analysis fails',
                  a: 'CollecTRI and PROGENy coverage is best for Human. Mouse is supported. Zebrafish has limited TF/pathway annotations — use MSigDB Hallmarks as an alternative.',
                },
                {
                  q: 'Pseudo-bulk PCA shows all samples overlapping',
                  a: 'Check that the sample column contains multiple unique values. Fewer than 3 samples per group will produce degenerate results.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-gray-50 rounded p-3">
                  <p className="font-medium text-gray-800">❓ {q}</p>
                  <p className="text-gray-600 mt-1">→ {a}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-gray-800">Citation</h4>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-4 text-sm">
              <p className="font-medium mb-1">If you use MASLDatlas in your research, please cite:</p>
              <blockquote className="border-l-4 border-indigo-400 pl-3 italic text-gray-700">
                MASLDatlas v2.0 — Multi-species single-cell RNA-seq atlas of Metabolic
                dysfunction-Associated Steatotic Liver Disease. (2024). Available at:{' '}
                <a
                  href="https://github.com/your-org/MASLDatlas"
                  className="text-indigo-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </blockquote>
              <p className="mt-3 text-xs text-gray-500">
                Please also cite the original datasets (GSE181483, GSE145086, GSE181987) and the
                tools used: Scanpy, decoupler-py, DESeq2, gseapy / Enrichr.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Documentation</h2>
        <p className="text-gray-500 mt-1">
          Reference guide for the MASLDatlas analysis platform. Click any section to expand.
        </p>
      </div>
      {sections.map((section) => (
        <Accordion key={section.id} section={section} />
      ))}
    </div>
  );
}
