import React from 'react';

export const DoodleProtractorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g fill="none" stroke="#231f20" strokeMiterlimit="10" strokeWidth="2">
        <path d="M52 48H12a4 4 0 01-4-4V42a28 28 0 0156 0v2a4 4 0 01-4 4H54" fill="#82d8a5"/>
        <path d="M52 48H12a2 2 0 01-2-2v-4h44v4a2 2 0 01-2 2z"/>
        <path d="M32 42V24.59" strokeLinecap="round"/>
        <path d="M44 42L36.73 21" strokeLinecap="round"/>
        <path d="M20 42l7.27-21" strokeLinecap="round"/>
        <path d="M52 42l-2.78-22" strokeLinecap="round"/>
        <path d="M12 42l2.78-22" strokeLinecap="round"/>
    </g>
  </svg>
);