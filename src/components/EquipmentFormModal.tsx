import { useState, type FormEvent } from 'react';
import { EQUIPMENT_STATUSES } from '../types';
import type { Equipment, EquipmentStatus, NewEquipment } from '../types';

export default function EquipmentFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Equipment;
  onClose: () => void;
  onSubmit: (data: NewEquipment) => Promise<void>;
}) {
  const [form, setForm] = useState<NewEquipment>({
    category: initial?.category ?? '',
    inventoryCode: initial?.inventoryCode ?? '',
    item: initial?.item ?? '',
    assignedTo: initial?.assignedTo ?? '',
    purchaseDate: initial?.purchaseDate ?? '',
    status: initial?.status ?? 'Good Condition',
    statusDetails: initial?.statusDetails ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save equipment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form onSubmit={handleSubmit} className="card max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-slate-800 text-lg">
          {initial ? 'Edit Equipment' : 'Add Equipment'}
        </h2>

        <Field label="Category">
          <input
            required
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Audio, Video, Networking, Consumables"
          />
        </Field>

        <Field label="Inventory Code (barcode value)">
          <input
            required
            className="input font-mono"
            value={form.inventoryCode}
            onChange={(e) => setForm({ ...form, inventoryCode: e.target.value.toUpperCase() })}
            placeholder="e.g. AUD-0001"
          />
        </Field>

        <Field label="Item">
          <input
            required
            className="input"
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            placeholder="e.g. Shure SM58 Wireless Mic"
          />
        </Field>

        <Field label="Assigned to">
          <input
            className="input"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            placeholder="Person/ministry primarily responsible (optional)"
          />
        </Field>

        <Field label="Purchase Date">
          <input
            type="date"
            className="input"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
        </Field>

        <Field label="Status">
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentStatus })}
          >
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status Details">
          <textarea
            className="input min-h-[70px]"
            value={form.statusDetails}
            onChange={(e) => setForm({ ...form, statusDetails: e.target.value })}
            placeholder="Notes, e.g. cracked casing, needs new battery..."
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
