/**
 * Download an image from a URL or data URI
 */
export function downloadImage(imageUrl: string, filename: string): void {
  if (!imageUrl) {
    console.warn('No image URL provided');
    return;
  }

  const link = document.createElement('a');
  link.href = imageUrl;
  
  // Add timestamp to filename
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = imageUrl.startsWith('data:image/png') ? 'png' : 
                    imageUrl.startsWith('data:image/svg') ? 'svg' : 'png';
  
  link.download = `${filename}_${timestamp}.${extension}`;
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download an image from a canvas element
 */
export function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  
  link.download = `${filename}_${timestamp}.png`;
  link.href = canvas.toDataURL('image/png');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Alias for downloadImage — downloads a base64/data-URI image as PNG.
 * Handles `data:image/png;base64,...` URIs returned by the backend directly.
 */
export const downloadImageAsPNG = downloadImage;
