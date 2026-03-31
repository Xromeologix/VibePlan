import React from 'react';

interface VibePlanIconProps {
  size?: number;
  variant?: 'dark' | 'light' | 'auto';
  className?: string;
}

export default function VibePlanIcon({ size = 40, variant = 'auto', className = '' }: VibePlanIconProps) {
  const id = `vp-${Math.random().toString(36).slice(2, 7)}`;

  if (variant === 'dark') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <filter id={`${id}-glow-lemon`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`${id}-glow-coral`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={`${id}-surge-dark`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0D83E" />
            <stop offset="50%" stopColor="#F0933E" />
            <stop offset="100%" stopColor="#F05A3E" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="44" fill="#111111" />
        <polygon points="50,100 60,82 80,82 90,100 80,118 60,118" fill="none" stroke="#F05A3E" strokeWidth="5" strokeLinejoin="round" filter={`url(#${id}-glow-coral)`} />
        <polygon points="50,100 60,82 80,82 90,100 80,118 60,118" fill="none" stroke="#F05A3E" strokeWidth="2.5" strokeLinejoin="round" opacity="0.9" />
        <polyline points="98,68 126,100 98,132" fill="none" stroke={`url(#${id}-surge-dark)`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow-lemon)`} />
        <polyline points="98,68 126,100 98,132" fill="none" stroke={`url(#${id}-surge-dark)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="118,68 146,100 118,132" fill="none" stroke={`url(#${id}-surge-dark)`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow-lemon)`} opacity="0.85" />
        <polyline points="118,68 146,100 118,132" fill="none" stroke={`url(#${id}-surge-dark)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        <polyline points="138,68 166,100 138,132" fill="none" stroke={`url(#${id}-surge-dark)`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow-lemon)`} opacity="0.65" />
        <polyline points="138,68 166,100 138,132" fill="none" stroke={`url(#${id}-surge-dark)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
      </svg>
    );
  }

  if (variant === 'light') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id={`${id}-surge-light`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F05A3E" />
            <stop offset="50%" stopColor="#F0933E" />
            <stop offset="100%" stopColor="#F0D83E" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="44" fill="#FFFFFF" />
        <polygon points="50,100 62,80 86,80 98,100 86,120 62,120" fill="#F05A3E" />
        <polyline points="96,65 128,100 96,135" fill="none" stroke={`url(#${id}-surge-light)`} strokeWidth="22" strokeLinecap="butt" strokeLinejoin="miter" />
        <polyline points="96,65 128,100 96,135" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="116,65 148,100 116,135" fill="none" stroke={`url(#${id}-surge-light)`} strokeWidth="22" strokeLinecap="butt" strokeLinejoin="miter" opacity="0.85" />
        <polyline points="116,65 148,100 116,135" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="136,65 168,100 136,135" fill="none" stroke={`url(#${id}-surge-light)`} strokeWidth="22" strokeLinecap="butt" strokeLinejoin="miter" opacity="0.70" />
        <polyline points="136,65 168,100 136,135" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`${id}-surge-auto`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F05A3E" />
          <stop offset="45%" stopColor="#F0933E" />
          <stop offset="100%" stopColor="#F0D83E" />
        </linearGradient>
      </defs>
      <polygon points="50,100 62,80 86,80 98,100 86,120 62,120" fill={`url(#${id}-surge-auto)`} />
      <polyline points="96,65 128,100 96,135" fill="none" stroke={`url(#${id}-surge-auto)`} strokeWidth="22" strokeLinecap="butt" strokeLinejoin="miter" />
      <polyline points="96,65 128,100 96,135" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="116,65 148,100 116,135" fill="none" stroke={`url(#${id}-surge-auto)`} strokeWidth="22" strokeLinecap="butt" strokeLinejoin="miter" opacity="0.82" />
      <polyline points="116,65 148,100 116,135" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="136,65 168,100 136,135" fill="none" stroke={`url(#${id}-surge-auto)`} strokeWidth="22" strokeLinecap="butt" strokeLinejoin="miter" opacity="0.62" />
      <polyline points="136,65 168,100 136,135" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
