import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { DashboardLayout } from './components/layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Login, Register } from './pages/auth';
import { Dashboard } from './pages/dashboard';
import { ProjectsPage, ProjectDetailPage } from './pages/projects';
import { TasksPage } from './pages/tasks';
import { UsersPage } from './pages/users';
import { ActivityLogsPage } from './pages/activity';
import { SettingsPage } from './pages/settings';
import ReportsPage from './pages/reports/ReportsPage';
import ManagerActivityPage from './pages/manager/ManagerActivityPage';
import TeamMembersPage from './pages/manager/TeamMembersPage';
import './styles/variables.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="activity-logs" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ActivityLogsPage />
                </ProtectedRoute>
              } />
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="roles" element={<SettingsPage />} />
              <Route path="manager-activity" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <ManagerActivityPage />
                </ProtectedRoute>
              } />
              <Route path="team" element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <TeamMembersPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
