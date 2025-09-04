import { SaleRow } from '../sales/query';

/**
 * Convert array of objects to CSV format
 */
export function arrayToCSV(data: any[], headers: string[]): string {
  // Create header row
  const csvHeaders = headers.join(',');
  
  // Convert data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      } else {
        value = String(value);
      }
      
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with BOM for proper UTF-8 handling in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export sales data to CSV
 */
export function exportSalesToCSV(sales: SaleRow[], filename: string = 'sales_filtered.csv'): void {
  const headers = [
    'customerName',
    'customerEmail', 
    'productName',
    'vendorName',
    'saleDateISO',
    'paymentMethod',
    'amountUsd',
    'status'
  ];
  
  const csvContent = arrayToCSV(sales, headers);
  downloadCSV(csvContent, filename);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}