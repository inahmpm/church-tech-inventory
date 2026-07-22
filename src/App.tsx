import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BorrowForm from './pages/BorrowForm';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Inventory from './pages/admin/Inventory';
import Requests from './pages/admin/Requests';
import ActiveBorrows from './pages/admin/ActiveBorrows';
import ReturnHistory from './pages/admin/ReturnHistory';
import Categories from './pages/admin/Categories';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/borrow" replace />} />
        <Route path="/borrow" element={<BorrowForm />} />

        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="requests" element={<Requests />} />
          <Route path="active" element={<ActiveBorrows />} />
          <Route path="history" element={<ReturnHistory />} />
          <Route path="categories" element={<Categories />} />
        </Route>

        <Route path="*" element={<Navigate to="/borrow" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
