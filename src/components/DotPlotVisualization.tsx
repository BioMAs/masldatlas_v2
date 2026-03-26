/**
 * DotPlot Visualization Component
 */
import { useDotPlotVisualization } from '../hooks/useDataset';
import { useFullscreen } from '../hooks/useFullscreen';
import { ActionButtons } from './ui/ActionButtons';
import { FullscreenModal } from './ui/FullscreenModal';
import { downloadImage } from '../utils/downloadImage';

interface DotPlotVisualizationProps {
  sessionId: string;
  genes: string[];
  groupby?: string;
}

export function DotPlotVisualization({ sessionId, genes, groupby = 'CellType' }: DotPlotVisualizationProps) {
  
  const { data, isLoading } = useDotPlotVisualization(sessionId, genes, groupby);
  const { isFullscreen, openFullscreen, closeFullscreen } = useFullscreen();

  const handleDownloadImage = () => {
    if (data?.image) {
      const filename = `dotplot_${genes.slice(0, 3).join('_')}`;
      downloadImage(data.image, filename);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Display backend-generated DotPlot
  if (data?.image) {
    const title = `Dot Plot - ${genes.length} Genes`;
    
    return (
      <>
        <div className="bg-white rounded-lg shadow-lg p-4 relative">
          <ActionButtons
            onDownloadImage={handleDownloadImage}
            onFullscreen={openFullscreen}
            position="top-right"
          />
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {title}
            </h3>
            <img 
              src={data.image}
              alt={`DotPlot for ${genes.join(', ')}`}
              className="max-w-full h-auto rounded-lg shadow"
            />
            <div className="mt-2 text-sm text-gray-500 overflow-x-auto max-w-full">
              Genes: {genes.join(', ')}
            </div>
          </div>
        </div>

        <FullscreenModal
          isOpen={isFullscreen}
          onClose={closeFullscreen}
          title={title}
        >
          <div className="flex flex-col items-center">
            <img 
              src={data.image}
              alt={`DotPlot for ${genes.join(', ')}`}
              className="max-w-full h-auto rounded-lg"
            />
            <div className="mt-4 text-sm text-gray-500 overflow-x-auto max-w-full">
              Genes: {genes.join(', ')}
            </div>
          </div>
        </FullscreenModal>
      </>
    );
  }

  return (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
      <p className="text-gray-500">No DotPlot data available</p>
    </div>
  );
}
