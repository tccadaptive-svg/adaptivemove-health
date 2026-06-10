import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, Calendar, Bot, MessageSquare,
  Globe, CreditCard, Settings, Shield, LogOut, ChevronLeft, ChevronRight, Accessibility
} from 'lucide-react';
import { LighthouseIcon } from '../ui/LighthouseIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useA11y } from '../../contexts/A11yContext';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map', icon: MapPin, label: 'Academias no Mapa' },
  { to: '/calendar', icon: Calendar, label: 'Meu Calendário' },
  { to: '/ai-chat', icon: Bot, label: 'Chat IA' },
  { to: '/messages', icon: MessageSquare, label: 'Mensagens' },
  { to: '/feed', icon: Globe, label: 'Feed Social' },
  { to: '/plans', icon: CreditCard, label: 'Planos' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { setPanelOpen } = useA11y();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      className={`hidden lg:flex flex-col bg-bg-secondary border-r border-white/[0.07] transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } flex-shrink-0 relative`}
    >
      {/* Logo */}
      <div className={`group flex items-center gap-3 px-4 py-5 border-b border-white/[0.07] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20 group-hover:scale-110 transition-transform">
          <LighthouseIcon size={24} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-display font-bold text-lg text-text-primary leading-none group-hover:text-accent-sky transition-colors">AdaptiveMove</h1>
            <p className="text-[10px] text-text-muted mt-0.5 leading-tight">Movimento para todos. Saúde para o mundo.</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-bg-card border border-white/10 rounded-full p-0.5 text-text-muted hover:text-text-primary hover:scale-110 active:scale-90 transition-all z-10"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Menu principal">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''} group`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
            {!collapsed && <span className="truncate group-hover:text-accent-sky transition-colors">{label}</span>}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? 'Admin' : undefined}
          >
            <Shield size={18} className="flex-shrink-0" />
            {!collapsed && <span>Admin</span>}
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 border-t border-white/[0.07] pt-4 space-y-2">
        {/* Accessibility button */}
        <button
          onClick={() => setPanelOpen(true)}
          className={`nav-item w-full ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Acessibilidade' : undefined}
          aria-label="Abrir painel de acessibilidade"
        >
          <Accessibility size={18} className="flex-shrink-0 text-accent-sky" />
          {!collapsed && <span className="text-accent-sky">Acessibilidade</span>}
        </button>

        {/* User */}
        {user && (
          <div className={`flex items-center gap-2 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-accent-blue">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user.full_name}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
