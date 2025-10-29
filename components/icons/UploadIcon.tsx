
import React from 'react';

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 18A5.25 5.25 0 009 20.25h6a5.25 5.25 0 005.25-5.25c0-2.01-1.125-3.75-2.625-4.583.156-.348.225-.724.225-1.117a4.5 4.5 0 00-9 0c0 .393.07.769.225 1.117-1.5 1.083-2.625 2.774-2.625 4.583A5.25 5.25 0 003.75 18z"
    />
  </svg>
);
