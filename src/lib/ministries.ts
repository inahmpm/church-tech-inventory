import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Ministry } from '../types';

const ministriesCol = collection(db, 'ministries');

export function subscribeMinistries(cb: (ministries: Ministry[]) => void) {
  const q = query(ministriesCol, orderBy('name'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ministry, 'id'>) })));
  });
}

export async function getMinistry(id: string): Promise<Ministry | null> {
  const snap = await getDoc(doc(db, 'ministries', id));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Ministry, 'id'>) } : null;
}

export async function getMinistryBySlug(slug: string): Promise<Ministry | null> {
  const q = query(ministriesCol, where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Ministry, 'id'>) };
}

export interface NewMinistry {
  name: string;
  slug: string;
  inventoryCodePrefix: string;
  notificationEmail: string;
}

export async function createMinistry(data: NewMinistry) {
  const now = Date.now();
  return addDoc(ministriesCol, { ...data, createdAt: now, updatedAt: now });
}

export async function updateMinistry(id: string, data: Partial<NewMinistry>) {
  await updateDoc(doc(db, 'ministries', id), { ...data, updatedAt: Date.now() });
}
