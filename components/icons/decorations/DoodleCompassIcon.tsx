import React from 'react';

export const DoodleCompassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="none" stroke="#231f20" strokeMiterlimit="10" strokeWidth="2">
      <path d="M32 8a4 4 0 11-4 4 4 4 0 014-4z" fill="#e6e7e8"/>
      <path d="M48 56L33.41 11.41M16 56L30.59 11.41" strokeLinecap="round" strokeWidth="2"/>
      <path d="M22 28h20" strokeLinecap="round" strokeWidth="2"/>
      <path d="M47 56a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4z" fill="#f08375"/>
      <path d="M15 56a1 1 0 011 1h2a1 1 0 011-1v-4a1 1 0 01-1-1h-2a1 1 0 01-1 1v4z" fill="#75c5f0"/>
    </g>
  </svg>
);