import { useEffect, useState } from 'react';
import {
  finalizeRequest,
  removeItemFromRequest,
  scanEquipmentIntoRequest,
  subscribeBorrowRequests,
} from '../../lib/borrowRequests';
import type { BorrowRequest } from '../../types';
import BarcodeScanner from '../../components/BarcodeScanner';

export default function Requests() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [open, setOpen] = useState<BorrowRequest | null>(null);

  useEffect(() => subscribeBorrowRequests(['pending', 'borrowed'], setRequests), []);

  // Keep the open request panel in sync with live updates (e.g. items added).
  useEffect(() => {
    if (!open) return;
    const fresh = requests.find((r) => r.id === open.id);
    if (fresh) setOpen(fresh);
    else setOpen(null);
  }, [requests, open?.id]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Borrow Requests</h1>

      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <Th>Submitted</Th>
              <Th>Name</Th>
              <Th>Ministry</Th>
              <Th>Contact No.</Th>
              <Th>Venue</Th>
              <Th>Requested Equipment</Th>
              <Th>Items Scanned</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <Td>{new Date(r.submittedAt).toLocaleString()}</Td>
                <Td>{r.name}</Td>
                <Td>{r.ministry}</Td>
                <Td>{r.contactNo}</Td>
                <Td>{r.venue}</Td>
                <Td className="max-w-xs truncate" title={r.equipmentRequested}>
                  {r.equipmentRequested}
                </Td>
                <Td>{r.items.length}</Td>
                <Td>
                  <button className="text-indigo-600 hover:underline text-xs" onClick={() => setOpen(r)}>
                    {r.items.length ? 'Manage scan' : 'Scan equipment'}
                  </button>
                </Td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-slate-400 py-8">
                  No pending or in-progress requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <ScanPanel request={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ScanPanel({ request, onClose }: { request: BorrowRequest; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  async function handleScan(code: string) {
    setError(null);
    try {
      await scanEquipmentIntoRequest(request.id, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan item.');
    }
  }

  async function handleRemove(equipmentId: string) {
    await removeItemFromRequest(request.id, equipmentId);
  }

  async function handleFinalize() {
    setFinalizing(true);
    setError(null);
    try {
      await finalizeRequest(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize.');
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="card max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="font-semibold text-slate-800 text-lg">{request.name}</h2>
          <p className="text-sm text-slate-500">
            {request.ministry} · {request.venue} · {request.contactNo}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Requested: <span className="italic">{request.equipmentRequested}</span>
          </p>
        </div>

        <BarcodeScanner onScan={handleScan} />
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">
            Scanned items ({request.items.length})
          </h3>
          {request.items.length === 0 ? (
            <p className="text-sm text-slate-400">No items scanned yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {request.items.map((item) => (
                <li key={item.equipmentId} className="py-2 flex justify-between items-center text-sm">
                  <span>
                    <span className="font-mono text-slate-500">{item.inventoryCode}</span> — {item.item}
                  </span>
                  <button
                    className="text-red-600 hover:underline text-xs"
                    onClick={() => handleRemove(item.equipmentId)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary"
            disabled={request.items.length === 0 || finalizing || !!request.fulfilledAt}
            onClick={handleFinalize}
          >
            {request.fulfilledAt ? 'Handed out' : finalizing ? 'Saving...' : 'Finalize hand-out'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <td className={`px-4 py-3 text-slate-700 ${className}`} title={title}>
      {children}
    </td>
  );
}
