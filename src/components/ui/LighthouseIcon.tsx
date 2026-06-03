import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export function LighthouseIcon({ size = 24, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Base */}
      <rect x="11" y="26" width="10" height="4" rx="1" fill="#2563EB" />
      {/* Tower */}
      <path d="M13 10 L11 26 H21 L19 10 Z" fill="#1d4ed8" />
      <path d="M13.5 10 L12 22 H20 L18.5 10 Z" fill="#2563EB" />
      {/* Windows */}
      <rect x="14" y="16" width="4" height="3" rx="0.5" fill="#38BDF8" />
      <rect x="14.5" y="12" width="3" height="2" rx="0.5" fill="#38BDF8" />
      {/* Top cap */}
      <rect x="12" y="7" width="8" height="3" rx="1" fill="#1d4ed8" />
      {/* Lamp house */}
      <rect x="13" y="4" width="6" height="3" rx="1" fill="#38BDF8" opacity="0.9" />
      {/* Light beams */}
      <line x1="16" y1="3" x2="16" y2="1" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="4" x2="21" y2="2" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="13" y1="4" x2="11" y2="2" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
