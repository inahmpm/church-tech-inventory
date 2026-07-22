import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createEquipment,
  deleteEquipment,
  deleteEquipmentBulk,
  subscribeEquipment,
  updateEquipment,
} from '../../lib/equipment';
import { EQUIPMENT_STATUSES } from '../../types';
import type { Equipment, NewEquipment } from '../../types';
import EquipmentPanel from '../../components/EquipmentPanel';
import ImportInventoryModal from '../../components/ImportInventoryModal';
import ExportInventoryModal from '../../components/ExportInventoryModal';

const PAGE_SIZE = 20;

type SortKey = 'category' | 'inventoryCode' | 'item' | 'assignedTo' | 'location' | 'purchaseDate' | 'status' | 'availability';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'category', label: 'Category' },
  { key: 'inventoryCode', label: 'Inventory Code' },
  { key: 'item', label: 'Items' },
  { key: 'assignedTo', label: 'Assigned to', className: 'hidden md:table-cell' },
  { key: 'location', label: 'Location', className: 'hidden lg:table-cell' },
  { key: 'purchaseDate', label: 'Purchase Date', className: 'hidden xl:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'availability', label: 'Availability', className: 'hidden sm:table-cell' },
];

export default function Inventory() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Equipment | 'new' | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'' | 'available' | 'borrowed'>('');
  const [sortKey, setSortKey] = useState<SortKey>('category');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeEquipment(setEquipment), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const categories = useMemo(() => Array.from(new Set(equipment.map((e) => e.category))).sort(), [equipment]);

  const activeFilterCount = [categoryFilter, statusFilter, availabilityFilter].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return equipment.filter((e) => {
      if (q) {
        const matches = [e.category, e.inventoryCode, e.item, e.assignedTo, e.location, e.status]
          .join(' ')
          .toLowerCase()
          .includes(q);
        if (!matches) return false;
      }
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      if (availabilityFilter === 'available' && e.isBorrowed) return false;
      if (availabilityFilter === 'borrowed' && !e.isBorrowed) return false;
      return true;
    });
  }, [equipment, search, categoryFilter, statusFilter, availabilityFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [filtered, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, availabilityFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(equipment.map((e) => e.id));
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [equipment]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const pageAllSelected = paged.length > 0 && paged.every((e) => selectedIds.has(e.id));

  function togglePageSelected() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) {
        paged.forEach((e) => next.delete(e.id));
      } else {
        paged.forEach((e) => next.add(e.id));
      }
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function clearFilters() {
    setCategoryFilter('');
    setStatusFilter('');
    setAvailabilityFilter('');
  }

  async function handleSave(data: NewEquipment) {
    if (selected === 'new') {
      await createEquipment(data);
    } else if (selected) {
      await updateEquipment(selected.id, data);
    }
  }

  async function handleDelete(e: Equipment) {
    if (e.isBorrowed) {
      alert('This item is currently borrowed and cannot be deleted.');
      return;
    }
    if (confirm(`Delete "${e.item}" (${e.inventoryCode})? This cannot be undone.`)) {
      await deleteEquipment(e.id);
      setSelected(null);
    }
  }

  async function handleBulkDelete() {
    const selectedItems = equipment.filter((e) => selectedIds.has(e.id));
    const borrowed = selectedItems.filter((e) => e.isBorrowed);
    const deletable = selectedItems.filter((e) => !e.isBorrowed);

    if (deletable.length === 0) {
      alert('The selected item(s) are currently borrowed and cannot be deleted.');
      return;
    }

    const warning =
      borrowed.length > 0
        ? `${borrowed.length} of the selected items are currently borrowed and will be skipped. `
        : '';
    if (!confirm(`${warning}Delete ${deletable.length} item(s)? This cannot be undone.`)) return;

    await deleteEquipmentBulk(deletable.map((e) => e.id));
    setSelectedIds(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Equipment Inventory</h1>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <button className="btn-secondary whitespace-nowrap text-red-600" onClick={handleBulkDelete}>
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <input
            className="input w-full sm:w-64"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="relative" ref={filterRef}>
            <button
              className="btn-secondary whitespace-nowrap relative"
              onClick={() => setShowFilters((v) => !v)}
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] w-4 h-4 align-middle">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilters && (
              <div className="absolute right-0 sm:right-auto mt-2 w-64 card p-4 space-y-3 z-30 shadow-lg">
                <Field label="Category">
                  <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    {EQUIPMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Availability">
                  <select
                    className="input"
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value as '' | 'available' | 'borrowed')}
                  >
                    <option value="">All</option>
                    <option value="available">Available</option>
                    <option value="borrowed">Borrowed</option>
                  </select>
                </Field>
                <div className="flex justify-end">
                  <button className="text-xs text-slate-500 hover:underline" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="btn-secondary whitespace-nowrap" onClick={() => setImporting(true)}>
            Import Inventory
          </button>
          <button className="btn-secondary whitespace-nowrap" onClick={() => setExporting(true)}>
            Export Inventory
          </button>
          <button className="btn-primary whitespace-nowrap" onClick={() => setSelected('new')}>
            + Add Equipment
          </button>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {paged.map((e) => {
          const isSelected = selected !== 'new' && selected?.id === e.id;
          return (
            <div
              key={e.id}
              onClick={() => setSelected(e)}
              className={`card p-3 space-y-1 cursor-pointer ${isSelected ? 'ring-2 ring-primary-400' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.has(e.id)}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={() => toggleSelected(e.id)}
                  />
                  <span className="font-medium text-slate-800">{e.item}</span>
                </span>
                <StatusBadge status={e.status} />
              </div>
              <div className="text-xs text-slate-500 font-mono">{e.inventoryCode}</div>
              <div className="text-xs text-slate-500">{e.category}</div>
              <div className="text-xs">
                {e.isBorrowed ? (
                  <span className="text-amber-600 font-medium">Borrowed</span>
                ) : (
                  <span className="text-green-600 font-medium">Available</span>
                )}
              </div>
            </div>
          );
        })}
        {paged.length === 0 && <div className="text-center text-slate-400 py-8">No equipment found.</div>}
      </div>

      {/* Desktop / tablet table */}
      <div className="card overflow-x-auto p-0 hidden sm:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <Th>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={pageAllSelected}
                  onChange={togglePageSelected}
                />
              </Th>
              {COLUMNS.map((col) => (
                <Th key={col.key} className={col.className} onClick={() => toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIndicator active={sortKey === col.key} dir={sortDir} />
                  </span>
                </Th>
              ))}
              <Th className="hidden xl:table-cell">Status Details</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((e) => {
              const isSelected = selected !== 'new' && selected?.id === e.id;
              return (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={`cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-primary-50' : ''}`}
                >
                  <Td>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedIds.has(e.id)}
                      onClick={(ev) => ev.stopPropagation()}
                      onChange={() => toggleSelected(e.id)}
                    />
                  </Td>
                  <Td>{e.category}</Td>
                  <Td className="font-mono">{e.inventoryCode}</Td>
                  <Td>{e.item}</Td>
                  <Td className="hidden md:table-cell">{e.assignedTo || '—'}</Td>
                  <Td className="hidden lg:table-cell">{e.location || '—'}</Td>
                  <Td className="hidden xl:table-cell">{e.purchaseDate || '—'}</Td>
                  <Td>
                    <StatusBadge status={e.status} />
                  </Td>
                  <Td className="hidden sm:table-cell">
                    {e.isBorrowed ? (
                      <span className="text-amber-600 font-medium">Borrowed</span>
                    ) : (
                      <span className="text-green-600 font-medium">Available</span>
                    )}
                  </Td>
                  <Td className="hidden xl:table-cell max-w-xs truncate" title={e.statusDetails}>
                    {e.statusDetails || '—'}
                  </Td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-slate-400 py-8">
                  No equipment found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary px-3 py-1"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-secondary px-3 py-1"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <EquipmentPanel
        open={selected !== null}
        initial={selected === 'new' || selected === null ? undefined : selected}
        onClose={() => setSelected(null)}
        onSubmit={handleSave}
        onDelete={handleDelete}
      />

      {importing && <ImportInventoryModal onClose={() => setImporting(false)} />}

      {exporting && <ExportInventoryModal equipment={sorted} onClose={() => setExporting(false)} />}
    </div>
  );
}

function sortValue(e: Equipment, key: SortKey): string {
  switch (key) {
    case 'availability':
      return e.isBorrowed ? 'borrowed' : 'available';
    default:
      return (e[key] || '').toLowerCase();
  }
}

function Th({
  children,
  className = '',
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      className={`px-4 py-3 font-medium select-none ${onClick ? 'cursor-pointer hover:text-slate-700' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
function Td({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <td className={`px-4 py-3 text-slate-700 ${className}`} title={title}>
      {children}
    </td>
  );
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return <span className="text-[10px] text-slate-400">{active ? (dir === 'asc' ? '▲' : '▼') : ''}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
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
