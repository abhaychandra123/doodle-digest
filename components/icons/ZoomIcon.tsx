import React from 'react';

export const ZoomIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fill="#2D8CFF" d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10l-6-6z"/>
    <path fill="#FFFFFF" d="M10.5 13.5H8v2h2.5a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5H8v2h2.5v1zM16 11h-2.5l2-2.5h-1.8L12 11.2V10a.5.5 0 0 0-.5-.5H10v.8l1.7 2.2H10v2h1.5a.5.5 0 0 0 .5-.5v-1.2L14.2 13H16v-2z"/>
    <path fill="#2D8CFF" d="M21 8.5h-5.5V3H21v5.5z"/>
    <path fill="#FFFFFF" d="M16 5.5v2h3v-1l-3-1z"/>
  </svg>
);