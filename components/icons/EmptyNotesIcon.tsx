import React from 'react';

export const EmptyNotesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect x="18" y="10" width="44" height="60" rx="4" fill="#a6e3a1"/>
        <path d="M18 14C18 11.7909 19.7909 10 22 10H28V70H22C19.7909 70 18 68.2091 18 66V14Z" fill="#313244"/>
        <rect x="34" y="22" width="20" height="4" rx="2" fill="#313244" fillOpacity="0.5"/>
        <rect x="34" y="32" width="20" height="4" rx="2" fill="#313244" fillOpacity="0.5"/>
        <rect x="34" y="42" width="20" height="4" rx="2" fill="#313244" fillOpacity="0.5"/>
    </svg>
);