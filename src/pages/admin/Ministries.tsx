import { useEffect, useState, type FormEvent } from 'react';
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
