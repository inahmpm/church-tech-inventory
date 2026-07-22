import { useEffect, useMemo, useState } from 'react';
import { subscribeHistoryLogs } from '../../lib/historyLogs';
import { HISTORY_LOG_ACTIONS } from '../../types';
import type { HistoryLogAction, HistoryLogEntry } from '../../types';

const ACTION_LABELS: Record<HistoryLogAction, string> = {
  created: 'Added',
  updated: 'Updated',
  deleted: 'Deleted',
  borrowed: 'Borrowed',
  removed: 'Removed from request',
  handed_out: 'Handed out',
  returned: 'Returned',
};

const ACTION_COLORS: Record<HistoryLogAction, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-slate-100 text-slate-600',
  deleted: 'bg-red-100 text-red-700',
  borrowed: 'bg-amber-100 text-amber-700',
  removed: 'bg-orange-100 text-orange-700',
  handed_out: 'bg-sky-100 text-sky-700',
  returned: 'bg-lime-100 text-lime-700',
};

export default function HistoryLogs() {
  const [logs, setLogs] = useState<HistoryLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'' | HistoryLogAction>('');

  useEffect(() => subscribeHistoryLogs(setLogs), []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (q) {
        const matches = [log.item, log.inventoryCode, log.details, log.actor ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, search, actionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-800">History Logs</h1>
        <div className="flex flex-wrap gap-2">
          <input
            className="input w-full sm:w-64"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as '' | HistoryLogAction)}
          >
            <option value="">All actions</option>
            {HISTORY_LOG_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 && <div className="card text-center text-slate-400 py-10">No movements logged yet.</div>}

      {rows.length > 0 && (
        <>
          {/* Mobile card list */}
          <div className="space-y-2 sm:hidden">
            {rows.map((log) => (
              <div key={log.id} className="card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{log.item}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                    {ACTION_LABELS[log.action]}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">{log.inventoryCode}</div>
                <div className="text-xs text-slate-600">{log.details}</div>
                <div className="text-xs text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                  {log.actor ? ` · ${log.actor}` : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop / tablet table */}
          <div className="card overflow-x-auto hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 font-medium">Barcode</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 pr-4 font-medium">Details</th>
                  <th className="py-2 pr-4 font-medium hidden md:table-cell">By</th>
                  <th className="py-2 pr-4 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4 text-slate-800">{log.item}</td>
                    <td className="py-2 pr-4 font-mono text-slate-400">{log.inventoryCode}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                        {ACTION_LABELS[log.action]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 hidden md:table-cell">{log.actor || '—'}</td>
                    <td className="py-2 pr-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
