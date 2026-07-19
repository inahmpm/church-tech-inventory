import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../lib/useAuth';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/requests', label: 'Borrow Requests' },
  { to: '/admin/active', label: 'Active Borrows' },
];

export default function AdminLayout() {
  const user = useAuth();

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }
  if (user === null) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="font-semibold text-slate-800">Church Tech Inventory — Admin</div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user.email}</span>
            <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => signOut(auth)}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
