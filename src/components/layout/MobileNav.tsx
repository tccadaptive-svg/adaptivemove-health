import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Calendar, Globe, MessageSquare } from 'lucide-react';

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/map', icon: MapPin, label: 'Mapa' },
  { to: '/calendar', icon: Calendar, label: 'Treinos' },
  { to: '/feed', icon: Globe, label: 'Feed' },
  { to: '/messages', icon: MessageSquare, label: 'Chat' },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-lg border-t border-white/[0.07] z-30 flex" aria-label="Navegação mobile">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all relative group ${
              isActive ? 'text-accent-blue' : 'text-text-muted'
            }`
          }
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              <div className={`relative ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                <Icon size={20} className="transition-transform" aria-hidden="true" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-blue" />
                )}
              </div>
              <span className={`transition-all ${isActive ? 'font-semibold' : 'group-hover:text-text-primary'}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
