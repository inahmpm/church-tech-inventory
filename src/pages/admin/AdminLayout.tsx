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
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-200 font-semibold text-slate-800">
          Church Tech Inventory
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-200 space-y-2">
          <div className="text-sm text-slate-500 truncate">{user.email}</div>
          <button
            className="text-sm text-slate-500 hover:text-slate-800"
            onClick={() => signOut(auth)}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
