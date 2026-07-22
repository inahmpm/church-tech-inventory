import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Category } from '../types';

const categoriesCol = collection(db, 'categories');

export function subscribeCategories(cb: (categories: Category[]) => void) {
  const q = query(categoriesCol, orderBy('name'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
  });
}

export async function createCategory(name: string) {
  await addDoc(categoriesCol, {
    name,
    subcategories: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, 'categories', id));
}

export async function addSubcategory(id: string, subcategory: string) {
  await updateDoc(doc(db, 'categories', id), {
    subcategories: arrayUnion(subcategory),
    updatedAt: Date.now(),
  });
}

export async function removeSubcategory(id: string, subcategory: string) {
  await updateDoc(doc(db, 'categories', id), {
    subcategories: arrayRemove(subcategory),
    updatedAt: Date.now(),
  });
}
