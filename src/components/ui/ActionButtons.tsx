import { Download, FileSpreadsheet, Maximize2, Image } from 'lucide-react';

interface ActionButtonsProps {
  onFullscreen?: () => void;
  onDownloadCSV?: () => void;
  onDownloadExcel?: () => void;
  onDownloadImage?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  className?: string;
}

/**
 * Reusable action buttons for visualizations (download, fullscreen)
 */
export function ActionButtons({
  onFullscreen,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadImage,
  position = 'top-right',
  className = '',
}: ActionButtonsProps) {
  const positionClasses = {
    'top-right': 'absolute top-2 right-2',
    'top-left': 'absolute top-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'inline': 'static'
  };

  const hasAnyButton = onFullscreen || onDownloadCSV || onDownloadExcel || onDownloadImage;

  if (!hasAnyButton) {
    return null;
  }

  return (
    <div className={`${positionClasses[position]} z-10 flex gap-2 ${className}`}>
      {onDownloadCSV && (
        <button
          onClick={onDownloadCSV}
          className="rounded-md bg-white p-2 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          title="Download as CSV"
          aria-label="Download as CSV"
        >
          <Download className="h-5 w-5" />
        </button>
      )}
      {onDownloadExcel && (
        <button
          onClick={onDownloadExcel}
          className="rounded-md bg-white p-2 text-green-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-green-700 transition-colors"
          title="Download as Excel"
          aria-label="Download as Excel"
        >
          <FileSpreadsheet className="h-5 w-5" />
        </button>
      )}
      {onDownloadImage && (
        <button
          onClick={onDownloadImage}
          className="rounded-md bg-white p-2 text-purple-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-purple-700 transition-colors"
          title="Download Image"
          aria-label="Download Image"
        >
          <Image className="h-5 w-5" />
        </button>
      )}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="rounded-md bg-blue-600 p-2 text-white shadow-sm hover:bg-blue-700 transition-colors"
          title="View Fullscreen"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
