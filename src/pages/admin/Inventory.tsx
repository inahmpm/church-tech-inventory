import { useEffect, useMemo, useState } from 'react';
import { createEquipment, deleteEquipment, subscribeEquipment, updateEquipment } from '../../lib/equipment';
import type { Equipment, NewEquipment } from '../../types';
import EquipmentFormModal from '../../components/EquipmentFormModal';
import BarcodeLabel from '../../components/BarcodeLabel';
import ImportInventoryModal from '../../components/ImportInventoryModal';
import ExportInventoryModal from '../../components/ExportInventoryModal';

export default function Inventory() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Equipment | 'new' | null>(null);
  const [printing, setPrinting] = useState<Equipment | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => subscribeEquipment(setEquipment), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter((e) =>
      [e.category, e.inventoryCode, e.item, e.assignedTo, e.location, e.status]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [equipment, search]);

  async function handleSave(data: NewEquipment) {
    if (editing === 'new') {
      await createEquipment(data);
    } else if (editing) {
      await updateEquipment(editing.id, data);
    }
  }

  async function handleDelete(e: Equipment) {
    if (e.isBorrowed) {
      alert('This item is currently borrowed and cannot be deleted.');
      return;
    }
    if (confirm(`Delete "${e.item}" (${e.inventoryCode})? This cannot be undone.`)) {
      await deleteEquipment(e.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-800">Equipment Inventory</h1>
        <div className="flex gap-2">
          <input
            className="input w-64"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary whitespace-nowrap" onClick={() => setImporting(true)}>
            Import Inventory
          </button>
          <button className="btn-secondary whitespace-nowrap" onClick={() => setExporting(true)}>
            Export Inventory
          </button>
          <button className="btn-primary whitespace-nowrap" onClick={() => setEditing('new')}>
            + Add Equipment
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <Th>Category</Th>
              <Th>Inventory Code</Th>
              <Th>Items</Th>
              <Th>Assigned to</Th>
              <Th>Location</Th>
              <Th>Purchase Date</Th>
              <Th>Status</Th>
              <Th>Status Details</Th>
              <Th>Availability</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td>{e.category}</Td>
                <Td className="font-mono">{e.inventoryCode}</Td>
                <Td>{e.item}</Td>
                <Td>{e.assignedTo || '—'}</Td>
                <Td>{e.location || '—'}</Td>
                <Td>{e.purchaseDate || '—'}</Td>
                <Td>
                  <StatusBadge status={e.status} />
                </Td>
                <Td className="max-w-xs truncate" title={e.statusDetails}>
                  {e.statusDetails || '—'}
                </Td>
                <Td>
                  {e.isBorrowed ? (
                    <span className="text-amber-600 font-medium">Borrowed</span>
                  ) : (
                    <span className="text-green-600 font-medium">Available</span>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-3 text-xs">
                    <button className="text-indigo-600 hover:underline" onClick={() => setPrinting(e)}>
                      Barcode
                    </button>
                    <button className="text-slate-600 hover:underline" onClick={() => setEditing(e)}>
                      Edit
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(e)}>
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-slate-400 py-8">
                  No equipment found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EquipmentFormModal
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSubmit={handleSave}
        />
      )}

      {printing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <BarcodeLabel value={printing.inventoryCode} itemName={printing.item} />
            <div className="flex justify-center gap-2 print:hidden">
              <button className="btn-secondary" onClick={() => setPrinting(null)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {importing && <ImportInventoryModal onClose={() => setImporting(false)} />}

      {exporting && <ExportInventoryModal equipment={filtered} onClose={() => setExporting(false)} />}
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Good Condition': 'bg-green-100 text-green-700',
    'Fair Condition': 'bg-lime-100 text-lime-700',
    'For Repair': 'bg-amber-100 text-amber-700',
    'For Replacement': 'bg-orange-100 text-orange-700',
    'For Disposal': 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
