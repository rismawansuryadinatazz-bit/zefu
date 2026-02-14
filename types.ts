
export enum UserRole {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
}

export type UsageType = 'SINGLE_USE' | 'REUSABLE';
export type TransactionType = 'IN' | 'OUT' | 'SHIFT';
export type WorkShift = 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3' | 'ADMIN';
export type ItemCondition = 'GOOD' | 'DAMAGED';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  size: string;
  expectedQty: number;
  actualQty: number;
  minStockThreshold: number;
  dailyUsage: number;
  unit: string;
  location: string;
  usageType: UsageType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  workShift: WorkShift;
  itemCondition: ItemCondition;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  performedBy: string;
  notes?: string;
}

export interface SheetConfig {
  scriptUrl: string;
  isConnected: boolean;
  autoSync: boolean;
  pullLock?: boolean; // New: Lock to prevent cloud from overwriting local data
}
