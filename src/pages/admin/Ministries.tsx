import { useEffect, useState, type FormEvent } from 'react';
import { createDepartment, subscribeDepartments } from '../../lib/departments';
import { createMinistry, subscribeMinistries, updateMinistry } from '../../lib/ministries';
import { DEFAULT_DEPARTMENTS, type Department, type Ministry } from '../../types';
import { createMinistry, subscribeMinistries } from '../../lib/ministries';
import { createUserInMinistry } from '../../lib/users';
import type { Ministry } from '../../types';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateTempPassword() {
  return `Church${Math.floor(1000 + Math.random() * 9000)}!${Math.random().toString(36).slice(2, 6)}`;
}

export default function Ministries() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [customDepartments, setCustomDepartments] = useState<Department[]>([]);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [savingDepartment, setSavingDepartment] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrefix, setEditPrefix] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [addingEditDepartment, setAddingEditDepartment] = useState(false);
  const [newEditDepartment, setNewEditDepartment] = useState('');
  const [savingEditDepartment, setSavingEditDepartment] = useState(false);

  useEffect(() => subscribeMinistries(setMinistries), []);
  useEffect(() => subscribeDepartments(setCustomDepartments), []);

  const departmentOptions = [
    ...DEFAULT_DEPARTMENTS,
    ...customDepartments.map((d) => d.name).filter((n) => !(DEFAULT_DEPARTMENTS as readonly string[]).includes(n)),
  ];

  async function addDepartmentAndSelect(rawName: string, select: (name: string) => void) {
    const trimmed = rawName.trim();
    if (!trimmed) return;
    if (departmentOptions.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      select(trimmed);
      return;
    }
    try {
      await createDepartment(trimmed);
      select(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department.');
      throw err;
    }
  }

  async function handleAddDepartment(e: FormEvent) {
    e.preventDefault();
    setSavingDepartment(true);
    try {
      await addDepartmentAndSelect(newDepartment, setDepartment);
      setNewDepartment('');
      setAddingDepartment(false);
    } catch {
      // error already recorded
    } finally {
      setSavingDepartment(false);
    }
  }

  async function handleAddEditDepartment(e: FormEvent) {
    e.preventDefault();
    setSavingEditDepartment(true);
    try {
      await addDepartmentAndSelect(newEditDepartment, setEditDepartment);
      setNewEditDepartment('');
      setAddingEditDepartment(false);
    } catch {
      // error already recorded
    } finally {
      setSavingEditDepartment(false);
    }
  }
  const [notificationEmail, setNotificationEmail] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ ministryName: string; adminEmail: string; tempPassword: string } | null>(
    null,
  );

  useEffect(() => subscribeMinistries(setMinistries), []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedPrefix = prefix.trim().toUpperCase();
    if (!trimmedName || !trimmedPrefix || !department) {
      setError('Department, ministry name, and inventory code prefix are required.');
    setCreated(null);
    const trimmedName = name.trim();
    const trimmedPrefix = prefix.trim().toUpperCase();
    const trimmedEmail = notificationEmail.trim();
    const trimmedAdminEmail = adminEmail.trim();
    if (!trimmedName || !trimmedPrefix || !trimmedEmail || !trimmedAdminEmail) {
      setError('All fields are required.');
      return;
    }
    const slug = slugify(trimmedName);
    if (ministries.some((m) => m.slug === slug)) {
      setError(`A ministry with slug "${slug}" already exists.`);
      return;
    }
    setCreating(true);
    try {
      await createMinistry({
        name: trimmedName,
        slug,
        inventoryCodePrefix: trimmedPrefix,
        department,
      });
      setName('');
      setPrefix('');
      setDepartment('');
      const ref = await createMinistry({
        name: trimmedName,
        slug,
        inventoryCodePrefix: trimmedPrefix,
        notificationEmail: trimmedEmail,
      });
      const tempPassword = generateTempPassword();
      await createUserInMinistry(trimmedAdminEmail, tempPassword, ref.id, 'ministry-admin');
      setCreated({ ministryName: trimmedName, adminEmail: trimmedAdminEmail, tempPassword });
      setName('');
      setPrefix('');
      setNotificationEmail('');
      setAdminEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ministry.');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(m: Ministry) {
    setError(null);
    setEditingId(m.id);
    setEditName(m.name);
    setEditPrefix(m.inventoryCodePrefix);
    setEditEmail(m.notificationEmail ?? '');
    setEditDepartment(m.department ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    const trimmedName = editName.trim();
    const trimmedPrefix = editPrefix.trim().toUpperCase();
    const trimmedEmail = editEmail.trim();
    if (!trimmedName || !trimmedPrefix || !editDepartment) {
      setError('Department, ministry name, and inventory code prefix are required.');
      return;
    }
    setSavingEdit(true);
    try {
      await updateMinistry(editingId, {
        name: trimmedName,
        inventoryCodePrefix: trimmedPrefix,
        notificationEmail: trimmedEmail,
        department: editDepartment,
      });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ministry.');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Ministries</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {created && (
        <div className="card bg-green-50 border-green-200 text-sm text-green-800 space-y-1">
          <p className="font-medium">
            "{created.ministryName}" created. Share these sign-in details with their admin:
          </p>
          <p>
            Email: <span className="font-mono">{created.adminEmail}</span>
          </p>
          <p>
            Temporary password: <span className="font-mono">{created.tempPassword}</span>
          </p>
          <p className="text-green-700">They'll be asked to set a new password on first login.</p>
        </div>
      )}

      <form onSubmit={handleCreate} className="card space-y-3">
        <h2 className="font-medium text-slate-800">Add a ministry</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Department <span className="text-red-600">*</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                className="input flex-1 min-w-0"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select a department</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingDepartment((v) => !v)}
                className="btn-secondary whitespace-nowrap px-3 shrink-0"
                title="Add a department"
                aria-label="Add a department"
              >
                + Department
              </button>
            </div>
            {addingDepartment && (
              <div className="mt-2 flex flex-wrap gap-2 items-end">
                <input
                  className="input flex-1 min-w-[10rem]"
                  placeholder="New department name, e.g. Media"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  disabled={savingDepartment || !newDepartment.trim()}
                  className="btn-primary whitespace-nowrap"
                >
                  {savingDepartment ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingDepartment(false);
                    setNewDepartment('');
                  }}
                  className="btn-secondary whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            )}
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Ministry name <span className="text-red-600">*</span>
            </span>
            <input
              className="input"
              placeholder="e.g. Music Ministry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Inventory code prefix <span className="text-red-600">*</span>
            </span>
            <input
              className="input"
              placeholder="e.g. MUSIC"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              required
            />
          </label>
        </div>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Ministry name</span>
            <input className="input" placeholder="e.g. Music Ministry" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Inventory code prefix</span>
            <input className="input" placeholder="e.g. MUSIC" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Notification email</span>
            <input
              type="email"
              className="input"
              placeholder="ministry@example.com"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">First admin's email</span>
            <input
              type="email"
              className="input"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
          {creating ? 'Creating...' : '+ Add Ministry'}
        </button>
      </form>

      <div className="space-y-3">
        {ministries.map((m) =>
          editingId === m.id ? (
            <form key={m.id} onSubmit={handleSaveEdit} className="card space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="block text-sm font-medium text-slate-700 mb-1">
                    Department <span className="text-red-600">*</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="input flex-1 min-w-0"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select a department</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setAddingEditDepartment((v) => !v)}
                      className="btn-secondary whitespace-nowrap px-3 shrink-0"
                      title="Add a department"
                      aria-label="Add a department"
                    >
                      + Department
                    </button>
                  </div>
                  {addingEditDepartment && (
                    <div className="mt-2 flex flex-wrap gap-2 items-end">
                      <input
                        className="input flex-1 min-w-[10rem]"
                        placeholder="New department name, e.g. Media"
                        value={newEditDepartment}
                        onChange={(e) => setNewEditDepartment(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleAddEditDepartment}
                        disabled={savingEditDepartment || !newEditDepartment.trim()}
                        className="btn-primary whitespace-nowrap"
                      >
                        {savingEditDepartment ? 'Adding...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingEditDepartment(false);
                          setNewEditDepartment('');
                        }}
                        className="btn-secondary whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">
                    Ministry name <span className="text-red-600">*</span>
                  </span>
                  <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">
                    Inventory code prefix <span className="text-red-600">*</span>
                  </span>
                  <input className="input" value={editPrefix} onChange={(e) => setEditPrefix(e.target.value)} required />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-sm font-medium text-slate-700 mb-1">
                    Notification email <span className="text-slate-400 font-normal">(optional)</span>
                  </span>
                  <input
                    type="email"
                    className="input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingEdit} className="btn-primary whitespace-nowrap">
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-secondary whitespace-nowrap">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div key={m.id} className="card flex items-center justify-between">
              <div>
                <h2 className="font-medium text-slate-800">{m.name}</h2>
                <p className="text-sm text-slate-500">
                  /borrow/{m.slug} &middot; prefix {m.inventoryCodePrefix}
                  {m.department ? <> &middot; {m.department}</> : null}
                  {m.notificationEmail ? <> &middot; {m.notificationEmail}</> : null}
                </p>
              </div>
              <button className="text-sm text-primary-600 hover:underline" onClick={() => startEdit(m)}>
                Edit
              </button>
            </div>
          ),
        )}
        {ministries.map((m) => (
          <div key={m.id} className="card flex items-center justify-between">
            <div>
              <h2 className="font-medium text-slate-800">{m.name}</h2>
              <p className="text-sm text-slate-500">
                /borrow/{m.slug} &middot; prefix {m.inventoryCodePrefix} &middot; {m.notificationEmail}
              </p>
            </div>
          </div>
        ))}
        {ministries.length === 0 && <div className="text-center text-slate-400 py-8">No ministries yet.</div>}
      </div>
    </div>
  );
}
