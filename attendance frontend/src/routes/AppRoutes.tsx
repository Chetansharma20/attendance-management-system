import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import ProtectedRoute from './ProtectedRoute.js';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
