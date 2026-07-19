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
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Equipment, NewEquipment } from '../types';

const equipmentCol = collection(db, 'equipment');

export function subscribeEquipment(cb: (items: Equipment[]) => void) {
  const q = query(equipmentCol, orderBy('category'), orderBy('item'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Equipment, 'id'>) })));
  });
}

export async function createEquipment(data: NewEquipment) {
  await addDoc(equipmentCol, {
    ...data,
    isBorrowed: false,
    activeBorrowRequestId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function updateEquipment(id: string, data: Partial<NewEquipment>) {
  await updateDoc(doc(db, 'equipment', id), { ...data, updatedAt: Date.now() });
}

export async function deleteEquipment(id: string) {
  await deleteDoc(doc(db, 'equipment', id));
}

export async function findEquipmentByCode(inventoryCode: string): Promise<Equipment | null> {
  const q = query(equipmentCol, where('inventoryCode', '==', inventoryCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Equipment, 'id'>) };
}

