import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { A11yProvider } from './contexts/A11yContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { CalendarPage } from './pages/CalendarPage';
import { AiChatPage } from './pages/AiChatPage';
import { MessagesPage } from './pages/MessagesPage';
import { FeedPage } from './pages/FeedPage';
import { PlansPage } from './pages/PlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Carregando...</p>
      </div>
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="ai-chat" element={<AiChatPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <A11yProvider>
          <AppRoutes />
        </A11yProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
