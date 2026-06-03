import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AccessibilityPanel } from './AccessibilityPanel';
import { useA11y } from '../../contexts/A11yContext';
import { Accessibility } from 'lucide-react';

export function AppLayout() {
  const { setPanelOpen } = useA11y();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <Outlet />
      </main>
      <MobileNav />
      <AccessibilityPanel />

      {/* Floating A11y button (mobile) */}
      <button
        onClick={() => setPanelOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 bg-accent-blue text-white rounded-full p-3 shadow-lg blue-glow"
        aria-label="Abrir painel de acessibilidade"
      >
        <Accessibility size={20} />
      </button>
    </div>
  );
}
