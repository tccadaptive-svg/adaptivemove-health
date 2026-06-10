import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Search, Star, Phone, Globe, Navigation, X, CheckCircle, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Gym } from '../types/database';

const gymIcon = new Icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <circle cx="16" cy="16" r="14" fill="#2563EB" stroke="white" stroke-width="2"/>
      <path d="M10 16 L14 16 L14 12 L18 12 L18 16 L22 16 L22 18 L18 18 L18 22 L14 22 L14 18 L10 18 Z" fill="white"/>
      <polygon points="16,34 10,24 22,24" fill="#2563EB"/>
    </svg>
  `)}`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

const userIcon = new Icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#22C55E" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const FILTER_CHIPS = ['Acessível', 'Piscina', 'Musculação', '24h', 'Personal Trainer'];


function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
}

export function MapPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filtered, setFiltered] = useState<Gym[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selected, setSelected] = useState<Gym | null>(null);
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGyms() {
      try {
        const { data } = await supabase.from('gyms').select('*');
        if (cancelled) return;
        setGyms(data || []);
        setFiltered(data || []);
      } catch (err) {
        console.error('Error loading gyms:', err);
        if (!cancelled) setMapError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGyms();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setUserCenter([p.coords.latitude, p.coords.longitude]),
        () => {},
        { timeout: 10000, enableHighAccuracy: false }
      );
    }

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let result = gyms;
    if (search) {
      result = result.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.address.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (activeFilters.length > 0) {
      result = result.filter(g =>
        activeFilters.every(f => {
          const amenities = g.amenities as string[];
          if (f === 'Acessível') return amenities.some(a => a.toLowerCase().includes('acessív'));
          return amenities.some(a => a.toLowerCase().includes(f.toLowerCase()));
        })
      );
    }
    setFiltered(result);
  }, [search, activeFilters, gyms]);

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const amenities = selected ? selected.amenities as string[] : [];
  const photos = selected ? selected.photos as string[] : [];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center animate-pulse">
            <MapPin size={32} className="text-accent-blue" aria-hidden="true" />
          </div>
          <p className="text-text-muted text-sm font-medium">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-warning" aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Erro ao carregar mapa</h2>
          <p className="text-text-muted text-sm mb-6">Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.</p>
          <button onClick={() => window.location.reload()} className="btn-primary inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Map */}
      <div className="flex-1 relative gradient-border">
        {/* Controls overlay */}
        <div className="absolute top-4 left-4 right-4 z-[400] space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar academia ou cidade..."
                className="input-field pl-9 shadow-xl backdrop-blur-sm bg-bg-secondary/80"
                aria-label="Buscar academia"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_CHIPS.map(f => (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105 active:scale-95 ${
                  activeFilters.includes(f)
                    ? 'bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20'
                    : 'bg-bg-secondary/80 backdrop-blur-sm border-white/10 text-text-muted hover:border-accent-blue/50 hover:text-text-primary'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => { setSearch(''); setActiveFilters([]); setFiltered(gyms); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-bg-secondary/80 backdrop-blur-sm text-text-muted hover:text-text-primary hover:border-red-500/50 transition-all hover:scale-105 active:scale-95"
            >
              <X size={12} /> Limpar filtros
            </button>
          </div>
        </div>

        <div ref={mapRef} className="w-full h-full">
          <MapContainer
            center={[-23.5637, -46.6547]}
            zoom={11}
            className="w-full h-full"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            />
            <MapController center={userCenter} />
            {userCenter && (
              <Marker position={userCenter} icon={userIcon}>
                <Popup>
                  <div className="text-text-primary font-medium text-sm">Sua localização</div>
                </Popup>
              </Marker>
            )}
            {filtered.map(gym => (
              <Marker
                key={gym.id}
                position={[gym.latitude, gym.longitude]}
                icon={gymIcon}
                eventHandlers={{ click: () => setSelected(gym) }}
              >
                <Popup>
                  <div className="text-text-primary font-medium">{gym.name}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Gym detail drawer */}
      {selected && (
        <div className="w-full lg:w-96 bg-bg-secondary border-l border-white/[0.07] overflow-y-auto flex flex-col animate-fade-in gradient-border">
          <div className="p-5 flex items-start justify-between sticky top-0 bg-bg-secondary/95 backdrop-blur-sm z-10 border-b border-white/[0.07]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-sky transition-colors">{selected.name}</h2>
                {selected.verified && <CheckCircle size={16} className="text-success flex-shrink-0" />}
              </div>
              <p className="text-text-muted text-sm mt-0.5">{selected.address}</p>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-primary transition-colors ml-2" aria-label="Fechar detalhes">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Photos */}
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-32 w-48 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(selected.rating) ? 'text-warning fill-warning' : 'text-white/20'} />
                ))}
              </div>
              <span className="text-text-muted text-sm">{selected.rating.toFixed(1)}</span>
            </div>

            {/* Contact */}
            {selected.phone && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Phone size={14} />
                <span>{selected.phone}</span>
              </div>
            )}
            {selected.website && (
              <div className="flex items-center gap-2 text-sm text-accent-sky">
                <Globe size={14} />
                <a href={selected.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                  {selected.website}
                </a>
              </div>
            )}

            {/* Amenities */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Serviços e Estrutura</h3>
              <div className="flex flex-wrap gap-2">
                {amenities.map(a => (
                  <span
                    key={a}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 ${
                      a.toLowerCase().includes('acessív') || a.toLowerCase().includes('adapta') || a.toLowerCase().includes('libras')
                        ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                        : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-text-primary'
                    }`}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-center text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Ver Rota
              </a>
              <button className="btn-secondary flex-1 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">Avaliar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
