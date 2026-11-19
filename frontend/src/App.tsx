import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDDashboard from './pages/HRDDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute allowedRole="employee" />}>
            <Route
              path="/employee"
              element={<EmployeeDashboard />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRole="hrd" />}>
            <Route
              path="/hrd"
              element={<HRDDashboard />}
            />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/access-denied"
            element={<AccessDeniedPage />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;