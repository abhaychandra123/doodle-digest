import React from 'react';

export const PinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    stroke="currentColor" 
    strokeWidth="1" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path 
      d="M16 3.81a2 2 0 0 0-3.46 1.47L12 12m0 0-1-1m1 1v10" 
      stroke="black"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M12 2v2.19c0 .24.11.47.3.64l3.87 3.87a2 2 0 0 0 2.83-2.83L15.13 2.5a2 2 0 0 0-3.13 1.31z" />
    <path d="M12 2v2.19c0 .24-.11.47-.3.64L7.83 8.7a2 2 0 1 0 2.83 2.83L14.53 7.66a2 2 0 0 0-1.22-3.85z" />
  </svg>
);