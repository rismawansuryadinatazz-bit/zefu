
import { InventoryItem, UserRole } from './types';

export const INITIAL_DATA: InventoryItem[] = [
  { id: '1', name: 'T-Shirt Cotton Pro', category: 'Apparel', size: 'XL', expectedQty: 100, actualQty: 100, minStockThreshold: 20, dailyUsage: 5, unit: 'pcs', location: 'Gudang Utama', usageType: 'REUSABLE', status: 'APPROVED', condition: 'GOOD', lastUpdated: '2024-03-20', updatedBy: 'Admin' },
  { id: '2', name: 'Running Shoes X-1', category: 'Footwear', size: '42', expectedQty: 5, actualQty: 5, minStockThreshold: 15, dailyUsage: 2, unit: 'pair', location: 'Gudang Singles', usageType: 'REUSABLE', status: 'PENDING', condition: 'GOOD', lastUpdated: '2024-03-21', updatedBy: 'Staff John', notes: 'Missing boxes' },
  { id: '3', name: 'Denim Jacket Heritage', category: 'Apparel', size: 'L', expectedQty: 30, actualQty: 30, minStockThreshold: 10, dailyUsage: 1, unit: 'pcs', location: 'Gudang Utama', usageType: 'REUSABLE', status: 'APPROVED', condition: 'GOOD', lastUpdated: '2024-03-18', updatedBy: 'Leader Sam' },
  { id: '4', name: 'Smartphone Case Ultra', category: 'Accessories', size: '6.7"', expectedQty: 2, actualQty: 2, minStockThreshold: 50, dailyUsage: 10, unit: 'pcs', location: 'Gudang Nugget', usageType: 'SINGLE_USE', status: 'REJECTED', condition: 'DAMAGED', lastUpdated: '2024-03-22', updatedBy: 'Staff Jane', notes: 'Damaged during transit' },
];

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: { canManageUsers: true, canApprove: true, canEdit: true, canExport: true },
  // Updated: Leader now has canManageUsers to allow system bootstrapping
  [UserRole.LEADER]: { canManageUsers: true, canApprove: true, canEdit: true, canExport: true },
  [UserRole.STAFF]: { canManageUsers: false, canApprove: false, canEdit: true, canExport: false },
};
