import React from 'react';

export const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.042.583.05a2.25 2.25 0 012.134 2.134c.008.193.025.388.05.583m0 0c.29.537.646 1.023 1.06 1.439.415.416.902.77 1.44 1.06m0 0c.85.502 1.91.502 2.76 0l.945-.564a2.25 2.25 0 001.21-1.932V10.134a2.25 2.25 0 00-1.21-1.932l-.945-.564c-.85-.502-1.91-.502-2.76 0L14.33 8.239a2.25 2.25 0 00-1.21 1.932v2.604c0 .48.18.94.5 1.309Z"
    />
  </svg>
);
