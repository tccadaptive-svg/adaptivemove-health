import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AccessibilitySettings } from '../types/database';
import { useAuth } from './AuthContext';

const DEFAULTS: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  textSpacing: false,
  enhancedFocus: false,
  colorBlindness: 'none',
  largeCursor: false,
};

interface A11yContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
}

const A11yContext = createContext<A11yContextType | null>(null);

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem('a11y_settings');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });
  const [panelOpen, setPanelOpen] = useState(false);

  // Sync from user db settings when user loads
  useEffect(() => {
    if (user?.accessibility_settings) {
      const merged = { ...DEFAULTS, ...user.accessibility_settings };
      setSettings(merged);
      applySettings(merged);
    }
  }, [user?.id]);

  function applySettings(s: AccessibilitySettings) {
    const root = document.documentElement;
    const body = document.body;

    // Font scale
    const fontMap = { small: '0.875', normal: '1', large: '1.125', xlarge: '1.25' };
    root.style.setProperty('--font-scale', fontMap[s.fontSize] || '1');

    // Text spacing
    if (s.textSpacing) {
      root.style.setProperty('--line-height-scale', '1.5');
      root.style.setProperty('--letter-spacing', '0.05em');
    } else {
      root.style.setProperty('--line-height-scale', '1');
      root.style.setProperty('--letter-spacing', 'normal');
    }

    // Toggle classes
    body.classList.toggle('high-contrast', s.highContrast);
    body.classList.toggle('reduce-motion', s.reduceMotion);
    body.classList.toggle('enhanced-focus', s.enhancedFocus);
    body.classList.toggle('large-cursor', s.largeCursor);

    // Color blindness
    ['protanopia', 'deuteranopia', 'tritanopia'].forEach(t =>
      body.classList.remove(`colorblind-${t}`)
    );
    if (s.colorBlindness !== 'none') {
      body.classList.add(`colorblind-${s.colorBlindness}`);
    }
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applySettings(next);
    localStorage.setItem('a11y_settings', JSON.stringify(next));
    if (user) {
      updateUser({ accessibility_settings: next });
    }
  };

  return (
    <A11yContext.Provider value={{ settings, updateSetting, panelOpen, setPanelOpen }}>
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error('useA11y must be used within A11yProvider');
  return ctx;
}
