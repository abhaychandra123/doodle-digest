import React from 'react';

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.056 1.02.086 1.5.086s.99-.03 1.5-.086m-7.5 2.962c.51.056 1.02.086 1.5.086s.99-.03 1.5-.086m0 0a5.25 5.25 0 00-7.5 0m7.5 0a5.25 5.25 0 01-7.5 0M12 15.75a3 3 0 01-3-3m3 3a3 3 0 003-3m-3 3a3 3 0 01-3-3m0 0c0-1.657 1.343-3 3-3s3 1.343 3 3m-3 3a3 3 0 01-3-3"
    />
  </svg>
);
