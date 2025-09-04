import { Sale } from '../types';

export type SaleStatus = Sale['status'];

// Spanish translations for sale status values
export const saleStatusTranslations: Record<SaleStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

/**
 * Get the Spanish translation for a sale status
 */
export function getSaleStatusLabel(status: SaleStatus): string {
  return saleStatusTranslations[status];
}

/**
 * Get all available sale statuses with their Spanish labels
 */
export function getSaleStatusOptions(): Array<{ value: SaleStatus; label: string }> {
  return Object.entries(saleStatusTranslations).map(([value, label]) => ({
    value: value as SaleStatus,
    label,
  }));
}