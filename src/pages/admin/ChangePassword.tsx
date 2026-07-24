import { useState, type FormEvent } from 'react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      await updatePassword(user, password);
      await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false });
    } catch {
      setError('Could not update password. Try signing out and back in, then retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold text-slate-800 text-center mb-2">Set a new password</h1>
        <p className="text-sm text-slate-500 text-center -mt-2">
          You're using a temporary password. Choose a new one to continue.
        </p>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">New password</span>
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Confirm password</span>
          <input
            type="password"
            required
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : 'Save password'}
        </button>
      </form>
    </div>
  );
}
