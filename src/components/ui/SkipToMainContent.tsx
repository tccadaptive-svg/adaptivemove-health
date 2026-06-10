import { useEffect } from 'react';

export function SkipToMainContent() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.target === document.body) {
        const skipLink = document.getElementById('skip-to-main');
        if (skipLink) {
          e.preventDefault();
          skipLink.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <a
      id="skip-to-main"
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-accent-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
    >
      Pular para o conteúdo principal
    </a>
  );
}
