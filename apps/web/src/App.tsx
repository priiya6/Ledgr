import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { RecordsPage } from './pages/Records';
import { AnalyticsPage } from './pages/Analytics';
import { UserManagementPage } from './pages/UserManagement';

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/records" element={<RecordsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/users" element={<UserManagementPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
