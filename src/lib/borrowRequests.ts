import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BorrowRequest, BorrowedItem } from '../types';

const requestsCol = collection(db, 'borrowRequests');
const equipmentCol = collection(db, 'equipment');

export interface PublicBorrowInput {
  name: string;
  ministry: string;
  contactNo: string;
  venue: string;
  equipmentRequested: string;
}

export async function submitBorrowRequest(input: PublicBorrowInput) {
  await addDoc(requestsCol, {
    ...input,
    status: 'pending',
    items: [],
    submittedAt: Date.now(),
    submittedAtServer: serverTimestamp(),
    fulfilledAt: null,
    returnedAt: null,
  });
}

export function subscribeBorrowRequests(
  statuses: BorrowRequest['status'][],
  cb: (items: BorrowRequest[]) => void,
) {
  const q = query(requestsCol, where('status', 'in', statuses), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BorrowRequest, 'id'>) })));
  });
}

/**
 * Scans one barcode and attaches the matching equipment to a pending request.
 * Runs as a transaction so an item can't be attached to two active borrows at once.
 */
export async function scanEquipmentIntoRequest(requestId: string, inventoryCode: string) {
  const q = query(equipmentCol, where('inventoryCode', '==', inventoryCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error(`No equipment found with barcode "${inventoryCode}"`);
  return runTransaction(db, async (tx) => {
    const equipDoc = snap.docs[0];
    const equipRef = doc(db, 'equipment', equipDoc.id);
    const equipSnapshot = await tx.get(equipRef);
    const equip = equipSnapshot.data();
    if (!equip) throw new Error('Equipment record not found');
    if (equip.isBorrowed) throw new Error(`"${equip.item}" (${inventoryCode}) is already borrowed`);

    const reqRef = doc(db, 'borrowRequests', requestId);
    const reqSnap = await tx.get(reqRef);
    const req = reqSnap.data() as BorrowRequest | undefined;
    if (!req) throw new Error('Borrow request not found');
    if (req.items.some((i) => i.inventoryCode === inventoryCode)) {
      throw new Error(`"${equip.item}" is already added to this request`);
    }

    const newItem: BorrowedItem = {
      equipmentId: equipDoc.id,
      inventoryCode,
      item: equip.item,
      category: equip.category,
    };

    tx.update(equipRef, { isBorrowed: true, activeBorrowRequestId: requestId, updatedAt: Date.now() });
    tx.update(reqRef, { items: [...req.items, newItem], status: 'borrowed' as const });

    return newItem;
  });
}

export async function removeItemFromRequest(requestId: string, equipmentId: string) {
  return runTransaction(db, async (tx) => {
    const reqRef = doc(db, 'borrowRequests', requestId);
    const equipRef = doc(db, 'equipment', equipmentId);
    const reqSnap = await tx.get(reqRef);
    const req = reqSnap.data() as BorrowRequest | undefined;
    if (!req) throw new Error('Borrow request not found');
    const items = req.items.filter((i) => i.equipmentId !== equipmentId);
    tx.update(reqRef, { items, status: items.length ? 'borrowed' : 'pending' });
    tx.update(equipRef, { isBorrowed: false, activeBorrowRequestId: null, updatedAt: Date.now() });
  });
}

export async function finalizeRequest(requestId: string) {
  const reqRef = doc(db, 'borrowRequests', requestId);
  return runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef);
    const req = reqSnap.data() as BorrowRequest | undefined;
    if (!req) throw new Error('Borrow request not found');
    if (!req.items.length) throw new Error('Scan at least one item before finalizing');
    tx.update(reqRef, { fulfilledAt: Date.now() });
  });
}

export async function markItemsReturned(requestId: string) {
  return runTransaction(db, async (tx) => {
    const reqRef = doc(db, 'borrowRequests', requestId);
    const reqSnap = await tx.get(reqRef);
    const req = reqSnap.data() as BorrowRequest | undefined;
    if (!req) throw new Error('Borrow request not found');
    for (const item of req.items) {
      tx.update(doc(db, 'equipment', item.equipmentId), {
        isBorrowed: false,
        activeBorrowRequestId: null,
        updatedAt: Date.now(),
      });
    }
    tx.update(reqRef, { status: 'returned', returnedAt: Date.now() });
  });
}
