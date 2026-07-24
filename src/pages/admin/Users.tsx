import { useEffect, useState, type FormEvent } from 'react';
import { useCurrentUser } from '../../lib/useCurrentUser';
import { createUserInMinistry, setUserActive, subscribeMinistryUsers } from '../../lib/users';
import type { AppUser, UserRole } from '../../types';

function generateTempPassword() {
  return `Church${Math.floor(1000 + Math.random() * 9000)}!${Math.random().toString(36).slice(2, 6)}`;
}

export default function Users() {
  const { profile } = useCurrentUser();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const ministryId = profile?.ministryId;

  useEffect(() => {
    if (!ministryId) return;
    return subscribeMinistryUsers(ministryId, setUsers);
  }, [ministryId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (!ministryId) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setCreating(true);
    try {
      const tempPassword = generateTempPassword();
      await createUserInMinistry(trimmedEmail, tempPassword, ministryId, role);
      setCreated({ email: trimmedEmail, tempPassword });
      setEmail('');
      setRole('member');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(u: AppUser) {
    setError(null);
    try {
      await setUserActive(u.uid, !u.active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Users</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {created && (
        <div className="card bg-green-50 border-green-200 text-sm text-green-800 space-y-1">
          <p className="font-medium">User created. Share these sign-in details:</p>
          <p>
            Email: <span className="font-mono">{created.email}</span>
          </p>
          <p>
            Temporary password: <span className="font-mono">{created.tempPassword}</span>
          </p>
          <p className="text-green-700">They'll be asked to set a new password on first login.</p>
        </div>
      )}

      <form onSubmit={handleCreate} className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="block text-sm font-medium text-slate-700 mb-1">Email</span>
          <input
            type="email"
            className="input"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Role</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="member">Member</option>
            <option value="ministry-admin">Ministry Admin</option>
            {profile?.role === 'super-admin' && <option value="super-admin">Super Admin</option>}
          </select>
        </label>
        <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
          {creating ? 'Adding...' : '+ Add User'}
        </button>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.uid} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{u.email}</p>
              <p className="text-sm text-slate-500">
                {u.role} &middot; {u.active ? 'Active' : 'Disabled'}
              </p>
            </div>
            <button
              className={`text-sm hover:underline ${u.active ? 'text-red-600' : 'text-primary-600'}`}
              onClick={() => handleToggleActive(u)}
            >
              {u.active ? 'Disable' : 'Re-enable'}
            </button>
          </div>
        ))}
        {users.length === 0 && <div className="text-center text-slate-400 py-8">No users yet.</div>}
      </div>
    </div>
  );
}
