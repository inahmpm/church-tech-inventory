import { useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../lib/useAuth';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/requests', label: 'Borrow Requests' },
  { to: '/admin/active', label: 'Active Borrows' },
  { to: '/admin/history', label: 'Return History' },
];

export default function AdminLayout() {
  const user = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }
  if (user === null) {
    return <Navigate to="/admin/login" replace />;
  }

  const activeLabel = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )?.label;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white sticky top-0 z-40">
        <button
          className="text-slate-600 p-2 -ml-2"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-semibold text-slate-800 text-sm">{activeLabel ?? 'Church Tech Inventory'}</span>
        <div className="w-8" />
      </header>

      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 font-semibold text-slate-800">
          Church Tech Inventory
          <button
            className="md:hidden text-slate-400 hover:text-slate-600 text-xl leading-none"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
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
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
