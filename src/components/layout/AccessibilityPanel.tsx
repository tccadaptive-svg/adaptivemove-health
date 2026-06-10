import { useEffect, useRef } from 'react';
import { X, Type, Contrast, Zap, AlignJustify, Focus, Eye, MousePointer, Info } from 'lucide-react';
import { useA11y } from '../../contexts/A11yContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function AccessibilityPanel() {
  const { settings, updateSetting, panelOpen, setPanelOpen } = useA11y();
  const focusTrapRef = useFocusTrap(panelOpen);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('keydown', handler);
    // Prevent body scroll when panel is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [panelOpen, setPanelOpen]);

  if (!panelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setPanelOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-label="Painel de Acessibilidade"
        aria-modal="true"
        tabIndex={-1}
        className="fixed left-0 top-0 h-full w-80 bg-bg-secondary border-r border-white/10 z-50 overflow-y-auto animate-slide-in-left focus:outline-none"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-text-primary">Acessibilidade</h2>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Fechar painel"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Font Size */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type size={16} className="text-accent-sky" />
                <span className="text-sm font-medium text-text-primary">Tamanho da fonte</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['small', 'normal', 'large', 'xlarge'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => updateSetting('fontSize', size)}
                    className={`py-1.5 rounded-md text-xs font-medium transition-all ${
                      settings.fontSize === size
                        ? 'bg-accent-blue text-white'
                        : 'bg-white/5 text-text-muted hover:bg-white/10'
                    }`}
                  >
                    {size === 'small' ? 'P' : size === 'normal' ? 'M' : size === 'large' ? 'G' : 'GG'}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            {[
              { key: 'highContrast' as const, icon: Contrast, label: 'Alto contraste' },
              { key: 'reduceMotion' as const, icon: Zap, label: 'Reduzir animações' },
              { key: 'textSpacing' as const, icon: AlignJustify, label: 'Espaçamento de texto' },
              { key: 'enhancedFocus' as const, icon: Focus, label: 'Foco visível aprimorado' },
              { key: 'largeCursor' as const, icon: MousePointer, label: 'Cursor grande' },
            ].map(({ key, icon: Icon, label }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-accent-sky" />
                  <span className="text-sm text-text-primary">{label}</span>
                </div>
                <button
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[key] ? 'bg-accent-blue' : 'bg-white/20'
                  }`}
                  role="switch"
                  aria-checked={settings[key]}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      settings[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}

            {/* Color Blindness */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={16} className="text-accent-sky" />
                <span className="text-sm font-medium text-text-primary">Daltonismo</span>
              </div>
              <select
                value={settings.colorBlindness}
                onChange={e => updateSetting('colorBlindness', e.target.value as typeof settings.colorBlindness)}
                className="w-full input-field text-sm"
              >
                <option value="none">Nenhum</option>
                <option value="protanopia">Protanopia</option>
                <option value="deuteranopia">Deuteranopia</option>
                <option value="tritanopia">Tritanopia</option>
              </select>
            </div>

            {/* Screen reader info */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-accent-sky mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-muted leading-relaxed">
                  O AdaptiveMove é compatível com leitores de tela NVDA, JAWS e VoiceOver. Use Tab para navegar e Enter/Espaço para ativar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
