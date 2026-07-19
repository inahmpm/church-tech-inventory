export const EQUIPMENT_STATUSES = [
  'Good Condition',
  'Fair Condition',
  'For Repair',
  'For Replacement',
  'For Disposal',
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export interface Equipment {
  id: string; // Firestore doc id
  category: string;
  inventoryCode: string; // unique barcode value
  item: string;
  assignedTo: string;
  location: string;
  purchaseDate: string; // yyyy-mm-dd
  status: EquipmentStatus;
  statusDetails: string;
  // Internal borrow-tracking fields, not part of the visible inventory table:
  isBorrowed: boolean;
  activeBorrowRequestId: string | null;
  createdAt: number;
  updatedAt: number;
}

export type NewEquipment = Omit<
  Equipment,
  'id' | 'isBorrowed' | 'activeBorrowRequestId' | 'createdAt' | 'updatedAt'
>;

export type BorrowRequestStatus = 'pending' | 'borrowed' | 'returned';

export interface BorrowedItem {
  equipmentId: string;
  inventoryCode: string;
  item: string;
  category: string;
}

export interface BorrowRequest {
  id: string;
  name: string;
  ministry: string;
  contactNo: string;
  venue: string;
  equipmentRequested: string; // free-text description from the public form
  status: BorrowRequestStatus;
  items: BorrowedItem[]; // populated by tech support while scanning
  submittedAt: number; // timestamp of form submission
  fulfilledAt: number | null; // timestamp scanning was completed / items handed out
  returnedAt: number | null; // timestamp items were returned
}
