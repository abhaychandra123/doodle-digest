import React from 'react';

export const DoodlePaperclipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path 
      d="M44,12a8,8,0,0,0-8,8V46a14,14,0,1,0,28,0V22" 
      fill="none" 
      stroke="#e6e7e8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="6"
    />
    <path 
      d="M30,52a8,8,0,0,1-8-8V18a14,14,0,1,1,28,0V42" 
      fill="none" 
      stroke="#75c5f0" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="6"
    />
  </svg>
);