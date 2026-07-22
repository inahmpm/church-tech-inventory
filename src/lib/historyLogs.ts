import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { HistoryLogAction, HistoryLogEntry } from '../types';

const historyLogsCol = collection(db, 'historyLogs');

export function logHistory(entry: {
  equipmentId: string;
  inventoryCode: string;
  item: string;
  action: HistoryLogAction;
  details: string;
}) {
  return addDoc(historyLogsCol, {
    ...entry,
    actor: auth.currentUser?.email ?? null,
    timestamp: Date.now(),
  });
}

export function subscribeHistoryLogs(cb: (items: HistoryLogEntry[]) => void) {
  const q = query(historyLogsCol, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryLogEntry, 'id'>) })));
  });
}
