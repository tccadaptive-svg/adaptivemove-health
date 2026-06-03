import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, Calendar, Globe, MessageSquare, Bot, CreditCard } from 'lucide-react';

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/map', icon: MapPin, label: 'Mapa' },
  { to: '/calendar', icon: Calendar, label: 'Treinos' },
  { to: '/feed', icon: Globe, label: 'Feed' },
  { to: '/messages', icon: MessageSquare, label: 'Chat' },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-white/[0.07] z-30 flex">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
              isActive ? 'text-accent-blue' : 'text-text-muted'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
