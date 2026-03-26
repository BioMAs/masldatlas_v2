import * as XLSX from 'xlsx';

/**
 * Export data to Excel format (.xlsx)
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and trigger download
  const excelFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, excelFilename);
}

/**
 * Export multiple sheets to a single Excel file
 */
export function exportMultipleSheetsToExcel(
  sheets: { data: any[]; sheetName: string }[],
  filename: string
): void {
  if (!sheets || sheets.length === 0) {
    console.warn('No sheets to export');
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Add each sheet
  sheets.forEach(({ data, sheetName }) => {
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
  });
  
  // Generate Excel file and trigger download
  const excelFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, excelFilename);
}
