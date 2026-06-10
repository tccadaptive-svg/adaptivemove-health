import { useEffect, useRef } from 'react';

interface AnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function ScreenReaderAnnouncer({ message, priority = 'polite' }: AnnouncerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = '';
      // Small delay to ensure screen readers pick up the change
      const timer = setTimeout(() => {
        if (ref.current) {
          ref.current.textContent = message;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      ref={ref}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    />
  );
}
