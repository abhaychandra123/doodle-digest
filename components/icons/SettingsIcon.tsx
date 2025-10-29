import React from 'react';

export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.962a8.25 8.25 0 015.69 5.69c.046.55.52.992 1.062 1.037.544.045 1.01.517 1.043 1.06.033.542-.423 1.033-.962 1.11a8.25 8.25 0 01-5.69 5.69c-.55.046-.992.52-1.037 1.062-.045.544-.517 1.01-1.06 1.043-.542.033-1.033-.423-1.11-.962a8.25 8.25 0 01-5.69-5.69c-.046-.55-.52-.992-1.062-1.037-.544-.045-1.01-.517-1.043-1.06-.033-.542.423-1.033.962-1.11a8.25 8.25 0 015.69-5.69c.55-.046.992-.52 1.037-1.062.045-.544.517-1.01 1.06-1.043z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);