import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Department } from '../types';

const departmentsCol = collection(db, 'departments');

export function subscribeDepartments(cb: (departments: Department[]) => void) {
  const q = query(departmentsCol, orderBy('name'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Department, 'id'>) })));
  });
}

export async function createDepartment(name: string) {
  await addDoc(departmentsCol, { name, createdAt: Date.now() });
}
