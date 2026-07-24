import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logHistory } from './historyLogs';
import type { Equipment, NewEquipment } from '../types';

const equipmentCol = collection(db, 'equipment');

export function subscribeEquipment(cb: (items: Equipment[]) => void) {
  const q = query(equipmentCol, orderBy('category'), orderBy('item'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Equipment, 'id'>) })));
  });
}

export async function createEquipment(data: NewEquipment) {
  const ref = await addDoc(equipmentCol, {
    ...data,
    isBorrowed: false,
    activeBorrowRequestId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await logHistory({
    equipmentId: ref.id,
    inventoryCode: data.inventoryCode,
    item: data.item,
    action: 'created',
    details: `Added to inventory as ${data.assignedType}`,
  }).catch((err) => console.error('Failed to log history for created equipment', err));
}

export async function updateEquipment(id: string, data: Partial<NewEquipment>) {
  await updateDoc(doc(db, 'equipment', id), { ...data, updatedAt: Date.now() });
  await logHistory({
    equipmentId: id,
    inventoryCode: data.inventoryCode ?? '',
    item: data.item ?? '',
    action: 'updated',
    details: `Updated: ${Object.keys(data).join(', ')}`,
  }).catch((err) => console.error('Failed to log history for updated equipment', err));
}

export async function deleteEquipment(id: string, equipment: Pick<Equipment, 'inventoryCode' | 'item'>) {
  await deleteDoc(doc(db, 'equipment', id));
  await logHistory({
    equipmentId: id,
    inventoryCode: equipment.inventoryCode,
    item: equipment.item,
    action: 'deleted',
    details: 'Removed from inventory',
  }).catch((err) => console.error('Failed to log history for deleted equipment', err));
}

const FIRESTORE_BATCH_LIMIT = 500;

export async function deleteEquipmentBulk(
  items: Pick<Equipment, 'id' | 'inventoryCode' | 'item'>[],
  details = 'Removed from inventory (bulk delete)',
) {
  for (let i = 0; i < items.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = items.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const item of chunk) {
      batch.delete(doc(db, 'equipment', item.id));
    }
    await batch.commit();
  }
  await Promise.all(
    items.map((item) =>
      logHistory({
        equipmentId: item.id,
        inventoryCode: item.inventoryCode,
        item: item.item,
        action: 'deleted',
        details,
      }).catch((err) => console.error('Failed to log history for bulk-deleted equipment', err)),
    ),
  );
}

export async function findEquipmentByCode(inventoryCode: string): Promise<Equipment | null> {
  const q = query(equipmentCol, where('inventoryCode', '==', inventoryCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Equipment, 'id'>) };
}

